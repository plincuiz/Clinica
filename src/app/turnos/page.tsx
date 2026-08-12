import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import TurnoActions from '@/components/TurnoActions'

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

export default async function TurnosPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })

  const turnos = await prisma.appointment.findMany({
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { startAt: 'desc' },
    take: 100,
  })

  const pendientes = turnos
    .filter((t) => ordenPendiente[t.estado] !== undefined)
    .sort((a, b) => ordenPendiente[a.estado] - ordenPendiente[b.estado] || a.startAt.getTime() - b.startAt.getTime())

  const cerrados = turnos
    .filter((t) => ordenPendiente[t.estado] === undefined)
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())

  const fila = (t: (typeof turnos)[number]) => {
    const puedeGestionar = esStaff || doctor?.id === t.doctorId
    return (
      <tr key={t.id} className="hover:bg-slate-50">
        <td className="px-6 py-4 text-sm text-slate-900">
          {new Date(t.startAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-6 py-4 text-sm text-slate-900">{t.patient.apellido}, {t.patient.nombre}</td>
        <td className="px-6 py-4 text-sm text-slate-500">{t.doctor.user.apellido}, {t.doctor.user.nombre}</td>
        <td className="px-6 py-4 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs ${prioridadColor[t.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
            {prioridadLabel[t.prioridad] ?? t.prioridad}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-slate-500">{t.estado.replace('_', ' ')}</td>
        <td className="px-6 py-4">{puedeGestionar ? <TurnoActions id={t.id} estado={t.estado} /> : null}</td>
      </tr>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Turnos</h1>
          <Link href="/turnos/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Nuevo Turno
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha y Hora</th>
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
