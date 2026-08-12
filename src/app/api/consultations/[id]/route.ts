import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

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
  await prisma.consultation.update({
    where: { id: cons.id },
    data: {
      evolutionNotes: String(body.evolutionNotes ?? ''),
      diagnosis: String(body.diagnosis ?? ''),
      treatmentPlan: String(body.treatmentPlan ?? ''),
      observaciones: String(body.observaciones ?? ''),
    },
  })

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'CONSULT_UPDATE', tableName: 'Consultation', recordId: cons.id },
  })

  return NextResponse.json({ ok: true })
}
