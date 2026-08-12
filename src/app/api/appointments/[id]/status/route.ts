import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const turnoId = Number(id)

  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const accion = String(body?.accion ?? '')

  const appt = await prisma.appointment.findUnique({ where: { id: turnoId }, include: { patient: true } })
  if (!appt) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })

  const rol = user.role.name
  const secretaria = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(rol)
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })
  const esMedico = doctor?.id === appt.doctorId

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  const userAgent = req.headers.get('user-agent') ?? ''

  let consultaId: number | null = null

  if (accion === 'recepcionar') {
    if (!secretaria) return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    if (appt.estado !== 'programado') return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    await prisma.appointment.update({ where: { id: turnoId }, data: { estado: 'en_espera' } })
  } else if (accion === 'ausente' || accion === 'cancelar') {
    if (!secretaria) return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    if (!['programado', 'en_espera'].includes(appt.estado)) return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    await prisma.appointment.update({ where: { id: turnoId }, data: { estado: accion === 'ausente' ? 'ausente' : 'cancelado' } })
  } else if (accion === 'atender') {
    if (!(esMedico || rol === 'SUPER_ADMIN')) return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    if (!['en_espera', 'programado'].includes(appt.estado)) return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })

    const s = new Date(appt.startAt)
    const dayStart = new Date(s.getFullYear(), s.getMonth(), s.getDate())
    const dayEnd = new Date(dayStart.getTime() + 86400000)

    const anterior = await prisma.appointment.findFirst({
      where: {
        doctorId: appt.doctorId,
        id: { not: turnoId },
        startAt: { gte: dayStart, lt: dayEnd },
        estado: { in: ['en_espera', 'en_atencion'] },
        AND: [{ startAt: { lt: appt.startAt } }],
      },
    })
    if (anterior) {
      return NextResponse.json({ error: 'Atendé primero el turno anterior que sigue en espera/atención.' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id: turnoId }, data: { estado: 'en_atencion' } })
      let cons = await tx.consultation.findUnique({ where: { appointmentId: turnoId } })
      if (!cons) {
        cons = await tx.consultation.create({ data: { appointmentId: turnoId, patientId: appt.patientId, doctorId: appt.doctorId } })
      }
      consultaId = cons.id
    })
  } else if (accion === 'finalizar') {
    if (!(esMedico || rol === 'SUPER_ADMIN')) return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    if (appt.estado !== 'en_atencion') return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    await prisma.$transaction(async (tx) => {
      const cons = await tx.consultation.findUnique({ where: { appointmentId: turnoId } })
      if (cons) {
        await tx.consultation.update({ where: { id: cons.id }, data: { status: 'finalizada', endAt: new Date() } })
        const billing = await tx.billingEntry.findUnique({ where: { consultationId: cons.id } })
        if (!billing) {
          await tx.billingEntry.create({
            data: {
              consultationId: cons.id,
              patientId: appt.patientId,
              doctorId: appt.doctorId,
              healthInsurerId: appt.patient.healthInsurerId,
              planId: appt.patient.planId ?? null,
              estado: 'pendiente_bono',
            },
          })
        }
      }
      await tx.appointment.update({ where: { id: turnoId }, data: { estado: 'atendido' } })
    })
  } else {
    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: `TURNO_${accion.toUpperCase()}`, tableName: 'Appointment', recordId: turnoId, ip, userAgent },
  })

  return NextResponse.json({ ok: true, consultaId })
}
