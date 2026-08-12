import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const body = await req.json()
  const action = String(body.action ?? 'create')

  if (action === 'update') {
    const doc = await prisma.doctor.findUnique({
      where: { id: Number(body.doctorId) },
      include: { user: true, specialties: true },
    })
    if (!doc) return NextResponse.json({ error: 'Médico no encontrado' }, { status: 404 })

    const dni = String(body.dni ?? '').trim()
    const nombre = String(body.nombre ?? '').trim()
    const apellido = String(body.apellido ?? '').trim()
    const email = body.email ? String(body.email).trim() : null
    const telefono = body.telefono ? String(body.telefono).trim() : null
    const password = String(body.password ?? '')
    const specialtyId = Number(body.specialtyId)
    const matricula = body.matricula ? String(body.matricula).trim() : null

    if (!dni || !nombre || !apellido) return NextResponse.json({ error: 'DNI, nombre y apellido son obligatorios.' }, { status: 400 })
    if (password && password.length < 6) return NextResponse.json({ error: 'La contraseña nueva debe tener al menos 6 caracteres.' }, { status: 400 })

    const data: any = { dni, nombre, apellido, email, telefono }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: doc.userId }, data })
        if (specialtyId) {
          if (doc.specialties.length > 0) {
            await tx.doctorSpecialty.update({
              where: { id: doc.specialties[0].id },
              data: { specialtyId, matricula },
            })
          } else {
            await tx.doctorSpecialty.create({ data: { doctorId: doc.id, specialtyId, matricula } })
          }
        }
      })
    } catch (e: any) {
      if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un usuario con ese DNI' }, { status: 400 })
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    await prisma.auditLog.create({ data: { userId: user.id, action: 'DOCTOR_UPDATE', tableName: 'Doctor', recordId: doc.id } })
    return NextResponse.json({ ok: true })
  }

  const dni = String(body.dni ?? '').trim()
  const nombre = String(body.nombre ?? '').trim()
  const apellido = String(body.apellido ?? '').trim()
  const password = String(body.password ?? '')
  const specialtyId = Number(body.specialtyId)
  const matricula = body.matricula ? String(body.matricula).trim() : null

  if (!dni || !nombre || !apellido || password.length < 6 || !specialtyId) {
    return NextResponse.json({ error: 'Completá DNI, nombre, apellido, especialidad y contraseña (mínimo 6 caracteres).' }, { status: 400 })
  }

  const doctorRole = await prisma.role.findUnique({ where: { name: 'DOCTOR' } })
  if (!doctorRole) return NextResponse.json({ error: 'Rol DOCTOR no encontrado' }, { status: 500 })

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const doctor = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: { dni, nombre, apellido, passwordHash, roleId: doctorRole.id } })
      const doc = await tx.doctor.create({ data: { userId: newUser.id } })
      await tx.doctorSpecialty.create({ data: { doctorId: doc.id, specialtyId, matricula } })
      return doc
    })
    return NextResponse.json(doctor, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un usuario con ese DNI' }, { status: 400 })
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
