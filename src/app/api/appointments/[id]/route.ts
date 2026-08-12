import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const turnoId = Number(id)
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const appt = await prisma.appointment.findUnique({ where: { id: turnoId } })
  if (!appt) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })

  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })
  const esMedicoDueno = user.role.name === 'DOCTOR' && doctor?.id === appt.doctorId
  if (!esStaff && !esMedicoDueno) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const body = await req.json()
  const action = String(body.action ?? '')

  if (action === 'cancelar') {
    if (!['programado', 'en_espera'].includes(appt.estado)) {
      return NextResponse.json({ error: 'Este turno ya no se puede cancelar' }, { status: 400 })
    }
    await prisma.appointment.update({ where: { id: turnoId }, data: { estado: 'cancelado' } })
    await prisma.auditLog.create({ data: { userId: user.id, action: 'TURNO_CANCELAR', tableName: 'Appointment', recordId: turnoId } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    if (!['programado', 'en_espera'].includes(appt.estado)) {
      return NextResponse.json({ error: 'Este turno ya no se puede editar' }, { status: 400 })
    }
    const patientId = Number(body.patientId ?? appt.patientId)
    const doctorId = user.role.name === 'DOCTOR' ? appt.doctorId : Number(body.doctorId ?? appt.doctorId)
    const fecha = String(body.fecha ?? '')
    const hora = String(body.hora ?? '')
    const durationMin = Number(body.durationMin ?? appt.durationMin)
    const prioridad = String(body.prioridad ?? appt.prioridad)
    const motivo = body.motivo ? String(body.motivo) : appt.motivo

    if (!fecha || !hora) return NextResponse.json({ error: 'Fecha y hora obligatorias' }, { status: 400 })
    const startAt = new Date(`${fecha}T${hora}:00`)
    if (isNaN(startAt.getTime())) return NextResponse.json({ error: 'Fecha u hora inválida' }, { status: 400 })
    const endAt = new Date(startAt.getTime() + durationMin * 60000)

    const overlap = await prisma.$queryRaw`
      SELECT id FROM Appointment
      WHERE doctorId = ${doctorId}
        AND id <> ${turnoId}
        AND estado NOT IN ('cancelado','ausente')
        AND datetime(startAt) < datetime(${endAt.toISOString()})
        AND datetime(startAt, '+' || durationMin || ' minutes') > datetime(${startAt.toISOString()})
      LIMIT 1`
    if (Array.isArray(overlap) && overlap.length > 0) {
      return NextResponse.json({ error: 'Se superpone con otro turno del médico.' }, { status: 400 })
    }

    await prisma.appointment.update({
      where: { id: turnoId },
      data: { patientId, doctorId, startAt, durationMin, prioridad, motivo },
    })
    await prisma.auditLog.create({ data: { userId: user.id, action: 'TURNO_UPDATE', tableName: 'Appointment', recordId: turnoId } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
}
