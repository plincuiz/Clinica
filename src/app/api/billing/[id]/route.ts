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

  const entry = await prisma.billingEntry.findUnique({ where: { id: Number(id) } })
  if (!entry) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  const body = await req.json()
  const action = String(body.action ?? '')

  if (action === 'cargar_bono') {
    if (entry.estado !== 'pendiente_bono') return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    const nro = String(body.nroOrdenBono ?? '').trim()
    if (!nro) return NextResponse.json({ error: 'Ingresá el número de orden/bono.' }, { status: 400 })
    const monto = Number(body.monto ?? 0) || 0
    await prisma.billingEntry.update({
      where: { id: entry.id },
      data: { nroOrdenBono: nro, monto, estado: 'listo_para_liquidar', fechaCargaBono: new Date() },
    })
  } else if (action === 'estado') {
    const nuevo = String(body.estado ?? '')
    const transiciones: Record<string, string[]> = {
      listo_para_liquidar: ['liquidado'],
      liquidado: ['pagado', 'debitado'],
      pagado: ['debitado'],
    }
    if (!(transiciones[entry.estado] ?? []).includes(nuevo)) {
      return NextResponse.json({ error: 'Transición no permitida' }, { status: 400 })
    }
    await prisma.billingEntry.update({ where: { id: entry.id }, data: { estado: nuevo } })
  } else {
    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: `BILLING_${action.toUpperCase()}`, tableName: 'BillingEntry', recordId: entry.id },
  })

  return NextResponse.json({ ok: true })
}
