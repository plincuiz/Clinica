import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { put } from '@vercel/blob'

const MAX = 10 * 1024 * 1024
const permitidos = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (user.role.name !== 'DOCTOR') {
    return NextResponse.json({ error: 'Acceso restringido a médicos' }, { status: 403 })
  }

  const cons = await prisma.consultation.findUnique({ where: { id: Number(id) } })
  if (!cons) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const doc = await prisma.doctor.findUnique({ where: { userId: user.id } })
  if (!doc || doc.id !== cons.doctorId) {
    return NextResponse.json({ error: 'No tenés permisos sobre esta consulta' }, { status: 403 })
  }

  const form = await req.formData().catch(() => null)
  const file = (form?.get('archivo') as File) ?? null
  if (!file || !file.name) return NextResponse.json({ error: 'Seleccioná un archivo' }, { status: 400 })
  if (file.size > MAX) return NextResponse.json({ error: 'El archivo supera los 10 MB' }, { status: 400 })
  if (!permitidos.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten PDF, PNG, JPG o WEBP' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const key = `${Date.now()}_${randomBytes(8).toString('hex')}.${ext}`

  let storageKey: string
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`adjuntos/${key}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })
    storageKey = blob.url
  } else {
    const dir = path.join(process.cwd(), 'storage')
    await mkdir(dir, { recursive: true })
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, key), buf)
    storageKey = key
  }

  const att = await prisma.attachment.create({
    data: {
      consultationId: cons.id,
      patientId: cons.patientId,
      uploadedById: user.id,
      fileName: file.name,
      storageKey,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  })

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'ATTACHMENT_UPLOAD', tableName: 'Consultation', recordId: cons.id },
  })

  return NextResponse.json(att, { status: 201 })
}
