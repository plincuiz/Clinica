import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { get } from '@vercel/blob'

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  if (user.role.name !== 'DOCTOR') {
    return NextResponse.json({ error: 'Acceso restringido a médicos' }, { status: 403 })
  }

  const att = await prisma.attachment.findUnique({ where: { id: Number(id) } })
  if (!att) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (att.storageKey.startsWith('http')) {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN ?? ''
      const result: any = await get(att.storageKey, { token })
      const stream = result?.stream ?? result?.body
      const contentType = result?.blob?.contentType ?? result?.contentType ?? att.mimeType
      if (!stream) return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
      return new NextResponse(stream, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(att.fileName)}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch {
      return NextResponse.json({ error: 'Archivo no disponible en el storage' }, { status: 404 })
    }
  }

  const buf = await readFile(path.join(process.cwd(), 'storage', att.storageKey)).catch(() => null)
  if (!buf) return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': att.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(att.fileName)}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
