import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

const LEVEL: Record<string, number> = { SUPER_ADMIN: 3, ADMIN: 2, DOCTOR: 1, SECRETARY: 1 }

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const actorLevel = LEVEL[user.role.name] ?? 0
  if (actorLevel < 2) return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })

  const body = await req.json()
  const action = String(body.action ?? 'create')

  if (action === 'toggle') {
    const target = await prisma.user.findUnique({ where: { id: Number(body.userId) }, include: { role: true } })
    if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (target.id === user.id) return NextResponse.json({ error: 'No podés desactivarte a vos mismo' }, { status: 400 })
    if (actorLevel <= (LEVEL[target.role.name] ?? 0)) {
      return NextResponse.json({ error: 'No podés modificar un usuario de mayor o igual jerarquía' }, { status: 403 })
    }
    await prisma.user.update({ where: { id: target.id }, data: { active: !target.active } })
    await prisma.auditLog.create({
      data: { userId: user.id, action: target.active ? 'USER_DISABLE' : 'USER_ENABLE', tableName: 'User', recordId: target.id },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    const target = await prisma.user.findUnique({ where: { id: Number(body.userId) }, include: { role: true } })
    if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const puedeEditar = target.id === user.id || actorLevel > (LEVEL[target.role.name] ?? 0)
    if (!puedeEditar) return NextResponse.json({ error: 'No tenés permisos para editar este usuario' }, { status: 403 })

    const dni = String(body.dni ?? '').trim()
    const nombre = String(body.nombre ?? '').trim()
    const apellido = String(body.apellido ?? '').trim()
    const email = body.email ? String(body.email).trim() : null
    const telefono = body.telefono ? String(body.telefono).trim() : null
    const password = String(body.password ?? '')

    if (!dni || !nombre || !apellido) return NextResponse.json({ error: 'DNI, nombre y apellido son obligatorios.' }, { status: 400 })
    if (password && password.length < 6) return NextResponse.json({ error: 'La contraseña nueva debe tener al menos 6 caracteres.' }, { status: 400 })

    let roleId = target.roleId
    const nuevoRol = String(body.role ?? '')
    if (nuevoRol && nuevoRol !== target.role.name) {
      if (user.role.name !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Solo el Super Admin puede cambiar roles.' }, { status: 403 })
      if (!['ADMIN', 'SECRETARY'].includes(nuevoRol) || !['ADMIN', 'SECRETARY'].includes(target.role.name)) {
        return NextResponse.json({ error: 'No se puede cambiar ese rol.' }, { status: 400 })
      }
      const rol = await prisma.role.findUnique({ where: { name: nuevoRol } })
      if (rol) roleId = rol.id
    }

    const data: any = { dni, nombre, apellido, email, telefono, roleId }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    try {
      await prisma.user.update({ where: { id: target.id }, data })
    } catch (e: any) {
      if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un usuario con ese DNI' }, { status: 400 })
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    await prisma.auditLog.create({ data: { userId: user.id, action: 'USER_UPDATE', tableName: 'User', recordId: target.id } })
    return NextResponse.json({ ok: true })
  }

  const dni = String(body.dni ?? '').trim()
  const nombre = String(body.nombre ?? '').trim()
  const apellido = String(body.apellido ?? '').trim()
  const password = String(body.password ?? '')
  const roleName = String(body.role ?? '')

  const creatable = user.role.name === 'SUPER_ADMIN' ? ['ADMIN', 'SECRETARY', 'DOCTOR'] : ['SECRETARY', 'DOCTOR']
  if (!creatable.includes(roleName)) return NextResponse.json({ error: 'No tenés permisos para crear ese rol' }, { status: 403 })
  if (!dni || !nombre || !apellido || password.length < 6) {
    return NextResponse.json({ error: 'Completá DNI, nombre, apellido y contraseña (mínimo 6 caracteres).' }, { status: 400 })
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } })
  if (!role) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

  try {
    if (roleName === 'DOCTOR') {
      const specialtyId = Number(body.specialtyId)
      if (!specialtyId) return NextResponse.json({ error: 'Seleccioná una especialidad para el médico.' }, { status: 400 })
      const matricula = body.matricula ? String(body.matricula).trim() : null
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({ data: { dni, nombre, apellido, passwordHash, roleId: role.id } })
        const doc = await tx.doctor.create({ data: { userId: newUser.id } })
        await tx.doctorSpecialty.create({ data: { doctorId: doc.id, specialtyId, matricula } })
      })
      return NextResponse.json({ ok: true }, { status: 201 })
    }

    const newUser = await prisma.user.create({
      data: { dni, nombre, apellido, passwordHash: await bcrypt.hash(password, 10), roleId: role.id },
    })
    await prisma.auditLog.create({ data: { userId: user.id, action: 'USER_CREATE', tableName: 'User', recordId: newUser.id } })
    return NextResponse.json(newUser, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un usuario con ese DNI' }, { status: 400 })
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
