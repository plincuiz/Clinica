import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)) {
    return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
  }

  const url = new URL(req.url)
  const vista = url.searchParams.get('vista') ?? 'obra'
  const desdeStr = url.searchParams.get('desde') ?? ''
  const hastaStr = url.searchParams.get('hasta') ?? ''
  const obraId = url.searchParams.get('obraId') ? Number(url.searchParams.get('obraId')) : null
  const doctorId = url.searchParams.get('doctorId') ? Number(url.searchParams.get('doctorId')) : null

  const now = new Date()
  const desde = desdeStr ? new Date(`${desdeStr}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
  const hasta = hastaStr ? new Date(`${hastaStr}T23:59:59`) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const entries = await prisma.billingEntry.findMany({
    where: {
      createdAt: { gte: desde, lte: hasta },
      ...(obraId ? { healthInsurerId: obraId } : {}),
      ...(doctorId ? { doctorId } : {}),
    },
    include: { patient: true, doctor: { include: { user: true } }, healthInsurer: true, plan: true },
    orderBy: { createdAt: 'asc' },
  })

  const rows = entries.map((e) => ({
    Fecha: new Date(e.createdAt).toLocaleDateString('es-AR'),
    Paciente: `${e.patient.apellido}, ${e.patient.nombre}`,
    DNI: e.patient.dni,
    Médico: `${e.doctor.user.apellido}, ${e.doctor.user.nombre}`,
    Obra_Social: e.healthInsurer.name,
    Plan: e.plan?.name ?? 'Sin plan',
    Nro_Orden: e.nroOrdenBono ?? 'PENDIENTE',
    Monto: e.monto.toFixed(2),
    Estado: e.estado.replace('_', ' '),
  }))

  const headers = ['Fecha', 'Paciente', 'DNI', 'Médico', 'Obra_Social', 'Plan', 'Nro_Orden', 'Monto', 'Estado']
  const csv = [
    headers.join(';'),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h as keyof typeof r] ?? '')
          return val.includes(';') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val
        })
        .join(';')
    ),
  ].join('\n')

  const fechaHoy = new Date().toISOString().slice(0, 10)
  const filename = `reporte_${vista}_${fechaHoy}.csv`

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
