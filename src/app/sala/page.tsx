import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import SalaActions from './SalaActions'

export const dynamic = 'force-dynamic'

const prioridadLabel: Record<string, string> = {
  urgencia: 'Urgencia',
  nueva_atencion: 'Nueva Atención',
  control: 'Control',
  derivacion: 'Derivación',
}

const prioridadColor: Record<string, string> = {
  urgencia: 'bg-red-100 text-red-700',
  nueva_atencion: 'bg-green-100 text-green-700',
  control: 'bg-blue-100 text-blue-700',
  derivacion: 'bg-yellow-100 text-yellow-800',
}

const ordenPendiente: Record<string, number> = { en_atencion: 0, en_espera: 1, programado: 2 }

function accionesPara(estado: string, rol: string, esMedico: boolean, anteriorPendiente: boolean): string[] {
  const acts: string[] = []
  const secretaria = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(rol)
  const medico = esMedico || rol === 'SUPER_ADMIN'

  if (estado === 'programado' && secretaria) acts.push('recepcionar', 'ausente', 'cancelar')
  if (estado === 'en_espera') {
    if (secretaria) acts.push('ausente', 'cancelar')
    if (medico && !anteriorPendiente) acts.push('atender')
  }
  if (estado === 'programado' && medico && !anteriorPendiente) acts.push('atender')
  if (estado === 'en_atencion' && medico) acts.push('finalizar')
  return acts
}

export default async function SalaPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start.getTime() + 86400000)

  const where: any = { startAt: { gte: start, lt: end } }
  if (doctor) where.doctorId = doctor.id

  const turnos = await prisma.appointment.findMany({
    where,
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { startAt: 'asc' },
  })

  const pendientes = turnos
    .filter((t) => ordenPendiente[t.estado] !== undefined)
    .sort((a, b) => ordenPendiente[a.estado] - ordenPendiente[b.estado] || a.startAt.getTime() - b.startAt.getTime())

  const cerrados = turnos
    .filter((t) => ordenPendiente[t.estado] === undefined)
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())

  const fila = (t: (typeof turnos)[number]) => {
    const esMedico = doctor?.id === t.doctorId
    const anteriorPendiente = turnos.some(
      (x) =>
        x.doctorId === t.doctorId &&
        x.id !== t.id &&
        x.startAt < t.startAt &&
        ['en_espera', 'en_atencion'].includes(x.estado)
    )
    return (
      <tr key={t.id} className="hover:bg-slate-50">
        <td className="px-6 py-4 text-sm text-slate-900">
          {new Date(t.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-6 py-4 text-sm text-slate-900">{t.patient.apellido}, {t.patient.nombre}</td>
        <td className="px-6 py-4 text-sm text-slate-500">{t.doctor.user.apellido}, {t.doctor.user.nombre}</td>
        <td className="px-6 py-4 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs ${prioridadColor[t.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
            {prioridadLabel[t.prioridad] ?? t.prioridad}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-slate-500">{t.estado.replace('_', ' ')}</td>
        <td className="px-6 py-4">
          <SalaActions turnoId={t.id} acciones={accionesPara(t.estado, user.role.name, esMedico, anteriorPendiente)} />
        </td>
      </tr>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Sala de Espera — Hoy</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pendientes.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No hay turnos pendientes.</td></tr>
              )}
              {pendientes.map(fila)}
              {cerrados.length > 0 && (
                <tr>
                  <td colSpan={6} className="bg-slate-200 px-6 py-2 text-xs font-bold text-slate-600 uppercase">
                    Atendidos / cerrados
                  </td>
                </tr>
              )}
              {cerrados.map(fila)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
