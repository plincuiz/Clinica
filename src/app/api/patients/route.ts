import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'DOCTOR'].includes(user.role.name)) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const body = await req.json()
  const action = String(body.action ?? 'create')

  if (action === 'update') {
    const target = await prisma.patient.findUnique({ where: { id: Number(body.patientId) } })
    if (!target) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })

    const dni = String(body.dni ?? '').trim()
    const nombre = String(body.nombre ?? '').trim()
    const apellido = String(body.apellido ?? '').trim()
    const healthInsurerId = Number(body.healthInsurerId)

    if (!dni || !nombre || !apellido || !healthInsurerId) {
      return NextResponse.json({ error: 'DNI, nombre, apellido y obra social son obligatorios.' }, { status: 400 })
    }

    try {
      await prisma.patient.update({
        where: { id: target.id },
        data: {
          dni,
          nombre,
          apellido,
          email: body.email ? String(body.email).trim() : null,
          telefono: body.telefono ? String(body.telefono).trim() : null,
          direccion: body.direccion ? String(body.direccion).trim() : null,
          fechaNacimiento: body.fechaNacimiento ? new Date(String(body.fechaNacimiento)) : null,
          sexo: body.sexo ? String(body.sexo) : null,
          nroAfiliado: body.nroAfiliado ? String(body.nroAfiliado).trim() : null,
          healthInsurerId,
          planId: body.planId ? Number(body.planId) : null,
        },
      })
    } catch (e: any) {
      if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un paciente con ese DNI' }, { status: 400 })
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    await prisma.auditLog.create({ data: { userId: user.id, action: 'PATIENT_UPDATE', tableName: 'Patient', recordId: target.id } })
    return NextResponse.json({ ok: true })
  }

  if (user.role.name === 'DOCTOR') {
    return NextResponse.json({ error: 'Los médicos solo pueden editar pacientes, no crearlos.' }, { status: 403 })
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        dni: String(body.dni).trim(),
        nombre: String(body.nombre).trim(),
        apellido: String(body.apellido).trim(),
        email: body.email ? String(body.email).trim() : null,
        telefono: body.telefono ? String(body.telefono).trim() : null,
        direccion: body.direccion ? String(body.direccion).trim() : null,
        fechaNacimiento: body.fechaNacimiento ? new Date(String(body.fechaNacimiento)) : null,
        sexo: body.sexo ? String(body.sexo) : null,
        nroAfiliado: body.nroAfiliado ? String(body.nroAfiliado).trim() : null,
        healthInsurerId: Number(body.healthInsurerId),
        planId: body.planId ? Number(body.planId) : null,
      },
    })
    return NextResponse.json(patient, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un paciente con ese DNI' }, { status: 400 })
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
