import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const target = await prisma.patient.findUnique({ where: { id: Number(id) } })
  if (!target) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })

  await prisma.patient.update({ where: { id: target.id }, data: { active: !target.active } })

  await prisma.auditLog.create({
    data: { userId: user.id, action: target.active ? 'PATIENT_DISABLE' : 'PATIENT_ENABLE', tableName: 'Patient', recordId: target.id },
  })

  return NextResponse.json({ ok: true })
}
