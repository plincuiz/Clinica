import { NextResponse } from 'next/server'
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

  if (action === 'toggle') {
    const target = await prisma.healthInsurer.findUnique({ where: { id: Number(body.id) } })
    if (!target) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    await prisma.healthInsurer.update({ where: { id: target.id }, data: { active: !target.active } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'plan_create') {
    const name = String(body.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'Nombre de plan obligatorio' }, { status: 400 })
    try {
      await prisma.insurancePlan.create({ data: { healthInsurerId: Number(body.insurerId), name } })
    } catch (e: any) {
      if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe ese plan en esta obra social' }, { status: 400 })
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  if (action === 'plan_toggle') {
    const plan = await prisma.insurancePlan.findUnique({ where: { id: Number(body.planId) } })
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    await prisma.insurancePlan.update({ where: { id: plan.id }, data: { active: !plan.active } })
    return NextResponse.json({ ok: true })
  }

  const datos = {
    name: String(body.name ?? '').trim(),
    cuit: body.cuit ? String(body.cuit).trim() : null,
    direccion: body.direccion ? String(body.direccion).trim() : null,
    telefono: body.telefono ? String(body.telefono).trim() : null,
    email: body.email ? String(body.email).trim() : null,
  }
  if (!datos.name) return NextResponse.json({ error: 'Nombre obligatorio' }, { status: 400 })

  if (action === 'update') {
    try {
      await prisma.healthInsurer.update({ where: { id: Number(body.id) }, data: datos })
    } catch (e: any) {
      if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe una obra social con ese nombre' }, { status: 400 })
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  try {
    const obra = await prisma.healthInsurer.create({ data: datos })
    return NextResponse.json(obra, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe una obra social con ese nombre' }, { status: 400 })
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
