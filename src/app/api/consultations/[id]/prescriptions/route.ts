import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { newToken, hashToken } from '@/lib/tokens'

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

  const body = await req.json()
  const medicamento = String(body.medicamento ?? '').trim()
  const dosis = String(body.dosis ?? '').trim()
  const frecuencia = String(body.frecuencia ?? '').trim()
  const duracion = String(body.duracion ?? '').trim()
  const instrucciones = body.instrucciones ? String(body.instrucciones).trim() : null

  if (!medicamento || !dosis || !frecuencia || !duracion) {
    return NextResponse.json({ error: 'Completá medicamento, dosis, frecuencia y duración.' }, { status: 400 })
  }

  const token = newToken()
  await prisma.prescription.create({
    data: {
      consultationId: cons.id,
      doctorId: cons.doctorId,
      patientId: cons.patientId,
      token,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 86400000),
      items: { create: { medicamento, dosis, frecuencia, duracion, instrucciones } },
    },
  })

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'PRESCRIPTION_CREATE', tableName: 'Consultation', recordId: cons.id },
  })

  return NextResponse.json({ ok: true, token })
}
