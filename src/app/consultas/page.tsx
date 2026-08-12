import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import ConsultasFilterForm from './ConsultasFilterForm'

export const dynamic = 'force-dynamic'

const estadoLabel: Record<string, string> = {
  en_proceso: 'En curso',
  finalizada: 'Finalizada',
  anulada: 'Anulada',
}

export default async function ConsultasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const hoy = new Date()
  const todayStart = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const desdeStr = sp.desde ?? ''
  const hastaStr = sp.hasta ?? ''
  const desde = desdeStr ? new Date(`${desdeStr}T00:00:00`) : todayStart
  const hasta = hastaStr ? new Date(`${hastaStr}T23:59:59`) : new Date(todayStart.getTime() + 86400000 - 1)
  const pacienteId = sp.pacienteId ? Number(sp.pacienteId) : null
  const doctorIdParam = sp.doctorId ? Number(sp.doctorId) : null
  const obraId = sp.obraId ? Number(sp.obraId) : null

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })

  const consultas = await prisma.consultation.findMany({
    where: {
      startAt: { gte: desde, lte: hasta },
      ...(doctor ? { doctorId: doctor.id } : {}),
      ...(pacienteId ? { patientId: pacienteId } : {}),
      ...(doctorIdParam && !doctor ? { doctorId: doctorIdParam } : {}),
      ...(obraId ? { patient: { healthInsurerId: obraId } } : {}),
    },
    include: { patient: { include: { healthInsurer: true } }, doctor: { include: { user: true } } },
    orderBy: { startAt: 'desc' },
    take: 200,
  })

  const abiertas = consultas.filter((c) => c.status === 'en_proceso')
  const cerradas = consultas.filter((c) => c.status !== 'en_proceso')

  const obras = await prisma.healthInsurer.findMany({ where: { active: true }, orderBy: { name: 'asc' } })
  const medicos = await prisma.doctor.findMany({ include: { user: true }, orderBy: { id: 'asc' } })
  const pacientes = await prisma.patient.findMany({ orderBy: { apellido: 'asc' }, take: 500 })

  const fila = (c: (typeof consultas)[number]) => (
    <tr key={c.id} className="hover:bg-slate-50">
      <td className="px-6 py-4 text-sm text-slate-900">
        {new Date(c.startAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-6 py-4 text-sm text-slate-900">{c.patient.apellido}, {c.patient.nombre}</td>
      <td className="px-6 py-4 text-sm text-slate-500">{c.doctor.user.apellido}, {c.doctor.user.nombre}</td>
      <td className="px-6 py-4 text-sm text-slate-500">{estadoLabel[c.status] ?? c.status}</td>
      <td className="px-6 py-4 text-sm">
        <Link href={`/consultas/${c.id}`} className="text-blue-700 hover:underline">Ver</Link>
      </td>
    </tr>
  )

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Consultas</h1>
        <ConsultasFilterForm
          obras={obras}
          medicos={medicos}
          pacientes={pacientes}
          actuales={{ desde: desdeStr, hasta: hastaStr, pacienteId: sp.pacienteId ?? '', doctorId: sp.doctorId ?? '', obraId: sp.obraId ?? '' }}
        />
        <p className="text-sm text-slate-600">
          Mostrando consultas del {desde.toLocaleDateString('es-AR')} al {hasta.toLocaleDateString('es-AR')}.
        </p>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {consultas.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No hay consultas en el período. Usá los filtros para buscar otras fechas.</td></tr>
              )}
              {abiertas.map(fila)}
              {cerradas.length > 0 && abiertas.length > 0 && (
                <tr>
                  <td colSpan={5} className="bg-slate-200 px-6 py-2 text-xs font-bold text-slate-600 uppercase">
                    Finalizadas / anuladas
                  </td>
                </tr>
              )}
              {cerradas.map(fila)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
