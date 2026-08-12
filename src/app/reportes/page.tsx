import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import ReportForm from './ReportForm'
import PrintButton from '@/components/PrintButton'
import ExportButton from './ExportButton'

export const dynamic = 'force-dynamic'

export default async function ReportesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)) redirect('/')

  const sp = await searchParams
  const vista = sp.vista ?? 'obra'
  const now = new Date()
  const desdeStr = sp.desde ?? ''
  const hastaStr = sp.hasta ?? ''
  const desde = desdeStr ? new Date(`${desdeStr}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
  const hasta = hastaStr ? new Date(`${hastaStr}T23:59:59`) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const obraId = sp.obraId ? Number(sp.obraId) : null
  const doctorId = sp.doctorId ? Number(sp.doctorId) : null

  const entries = await prisma.billingEntry.findMany({
    where: {
      createdAt: { gte: desde, lte: hasta },
      ...(obraId ? { healthInsurerId: obraId } : {}),
      ...(doctorId ? { doctorId } : {}),
    },
    include: { patient: true, doctor: { include: { user: true } }, healthInsurer: true, plan: true },
    orderBy: { createdAt: 'asc' },
  })

  const obras = await prisma.healthInsurer.findMany({ where: { active: true }, orderBy: { name: 'asc' } })
  const medicos = await prisma.doctor.findMany({ include: { user: true }, orderBy: { id: 'asc' } })

  const totalMonto = entries.reduce((s, e) => s + e.monto, 0)

  const porMedico = new Map<string, typeof entries>()
  for (const e of entries) {
    const k = `${e.doctor.user.apellido}, ${e.doctor.user.nombre}`
    if (!porMedico.has(k)) porMedico.set(k, [])
    porMedico.get(k)!.push(e)
  }

  const porObra = new Map<string, typeof entries>()
  for (const e of entries) {
    const k = `${e.healthInsurer.name} — ${e.plan?.name ?? 'Sin plan'}`
    if (!porObra.has(k)) porObra.set(k, [])
    porObra.get(k)!.push(e)
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <PrintButton />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Reportes de Gestión</h1>
          <ExportButton params={{ vista, desde: desdeStr, hasta: hastaStr, obraId: sp.obraId ?? '', doctorId: sp.doctorId ?? '' }} />
        </div>
        <ReportForm obras={obras} medicos={medicos} actuales={{ vista, desde: desdeStr, hasta: hastaStr, obraId: sp.obraId ?? '', doctorId: sp.doctorId ?? '' }} />

        <p className="text-sm text-slate-600">
          Período: {desde.toLocaleDateString('es-AR')} — {hasta.toLocaleDateString('es-AR')} | Atenciones: {entries.length} | Monto total: ${totalMonto.toFixed(2)}
        </p>

        {vista === 'obra' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Detalle por Obra Social</h2>
            {entries.length === 0 && <p className="text-sm text-slate-500">Sin atenciones en el período.</p>}
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Paciente</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Médico</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Obra Social</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Plan</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 uppercase">Nro Orden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-sm">{new Date(e.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-2 text-sm">{e.patient.apellido}, {e.patient.nombre}</td>
                    <td className="px-4 py-2 text-sm">{e.doctor.user.apellido}, {e.doctor.user.nombre}</td>
                    <td className="px-4 py-2 text-sm">{e.healthInsurer.name}</td>
                    <td className="px-4 py-2 text-sm">{e.plan?.name ?? '-'}</td>
                    <td className="px-4 py-2 text-sm">{e.nroOrdenBono ?? 'PENDIENTE'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vista === 'medico' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Liquidación por Médico</h2>
            {porMedico.size === 0 && <p className="text-sm text-slate-500">Sin atenciones en el período.</p>}
            {[...porMedico.entries()].map(([medico, list]) => {
              const porObraDelMedico = new Map<string, typeof list>()
              for (const e of list) {
                const k = `${e.healthInsurer.name} — ${e.plan?.name ?? 'Sin plan'}`
                if (!porObraDelMedico.has(k)) porObraDelMedico.set(k, [])
                porObraDelMedico.get(k)!.push(e)
              }
              return (
                <div key={medico} className="border rounded p-4">
                  <p className="font-semibold text-slate-800">{medico} — Total pacientes: {list.length}</p>
                  <ul className="mt-2 text-sm text-slate-600 space-y-1">
                    {[...porObraDelMedico.entries()].map(([obra, l]) => (
                      <li key={obra}>
                        {obra}: {l.length} atenciones — ${l.reduce((s, e) => s + e.monto, 0).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {vista === 'general' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Reporte General (Médico → Obra Social → Detalle)</h2>
            {porMedico.size === 0 && <p className="text-sm text-slate-500">Sin atenciones en el período.</p>}
            {[...porMedico.entries()].map(([medico, list]) => (
              <div key={medico} className="border rounded p-4">
                <p className="font-semibold text-slate-800">{medico}</p>
                {[...porObraDe(list).entries()].map(([obra, l]) => (
                  <div key={obra} className="mt-2 ml-4">
                    <p className="text-sm font-medium text-slate-700">{obra} ({l.length})</p>
                    <ul className="ml-4 text-sm text-slate-600 space-y-1">
                      {l.map((e) => (
                        <li key={e.id}>
                          {new Date(e.createdAt).toLocaleDateString('es-AR')} — {e.patient.apellido}, {e.patient.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function porObraDe(list: any[]) {
  const m = new Map<string, any[]>()
  for (const e of list) {
    const k = `${e.healthInsurer.name} — ${e.plan?.name ?? 'Sin plan'}`
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(e)
  }
  return m
}
