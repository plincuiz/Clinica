import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const doc = await prisma.doctor.findUnique({ where: { id: Number(id) }, include: { user: true } })
  if (!doc) return NextResponse.json({ error: 'Médico no encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.doctor.update({ where: { id: doc.id }, data: { active: !doc.active } })
    await tx.user.update({ where: { id: doc.userId }, data: { active: !doc.active } })
  })

  await prisma.auditLog.create({
    data: { userId: user.id, action: doc.active ? 'DOCTOR_DISABLE' : 'DOCTOR_ENABLE', tableName: 'Doctor', recordId: doc.id },
  })

  return NextResponse.json({ ok: true })
}
