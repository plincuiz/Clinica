import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const doctorId = Number(url.searchParams.get('doctorId') ?? 0)
  const fecha = String(url.searchParams.get('fecha') ?? '')
  if (!doctorId || !fecha) return NextResponse.json([])

  const start = new Date(`${fecha}T00:00:00`)
  const end = new Date(`${fecha}T23:59:59`)

  const list = await prisma.appointment.findMany({
    where: { doctorId, startAt: { gte: start, lte: end }, estado: { notIn: ['cancelado'] } },
    include: { patient: true },
    orderBy: { startAt: 'asc' },
  })

  return NextResponse.json(
    list.map((a) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      durationMin: a.durationMin,
      estado: a.estado,
      paciente: `${a.patient.apellido}, ${a.patient.nombre}`,
    }))
  )
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'DOCTOR'].includes(user.role.name)) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const body = await req.json()
  let doctorId = Number(body.doctorId)

  if (user.role.name === 'DOCTOR') {
    const doc = await prisma.doctor.findUnique({ where: { userId: user.id } })
    if (!doc) return NextResponse.json({ error: 'Perfil de médico no encontrado' }, { status: 403 })
    doctorId = doc.id
  }

  const patientId = Number(body.patientId)
  const fecha = String(body.fecha ?? '')
  const hora = String(body.hora ?? '')
  const motivo = body.motivo ? String(body.motivo) : null
  const prioridad = String(body.prioridad ?? 'control')
  const durationMin = Number(body.durationMin ?? 30)

  if (!patientId || !doctorId || !fecha || !hora) {
    return NextResponse.json({ error: 'Completá paciente, médico, fecha y hora.' }, { status: 400 })
  }

  const startAt = new Date(`${fecha}T${hora}:00`)
  if (isNaN(startAt.getTime())) return NextResponse.json({ error: 'Fecha u hora inválida.' }, { status: 400 })
  const endAt = new Date(startAt.getTime() + durationMin * 60000)

  const overlap = await prisma.$queryRawUnsafe(
    `SELECT id FROM "Appointment"
     WHERE "doctorId" = $1
       AND estado NOT IN ('cancelado','ausente')
       AND "startAt" < $2
       AND ("startAt" + ("durationMin" * interval '1 minute')) > $3
     LIMIT 1`,
    doctorId,
    endAt,
    startAt
  )

  if (Array.isArray(overlap) && overlap.length > 0) {
    return NextResponse.json({ error: 'El médico ya tiene un turno que se superpone en ese horario.' }, { status: 400 })
  }

  const appt = await prisma.appointment.create({
    data: { patientId, doctorId, startAt, motivo, prioridad, durationMin },
  })
  return NextResponse.json(appt, { status: 201 })
}
