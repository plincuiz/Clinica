import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import TurnoActions from '@/components/TurnoActions'

export const dynamic = 'force-dynamic'

const prioridadColor: Record<string, string> = {
  urgencia: 'bg-red-100 text-red-700',
  nueva_atencion: 'bg-green-100 text-green-700',
  control: 'bg-blue-100 text-blue-700',
  derivacion: 'bg-yellow-100 text-yellow-800',
}

const ordenPendiente: Record<string, number> = { en_atencion: 0, en_espera: 1, programado: 2 }

function fechaLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)
  const esDoctor = user.role.name === 'DOCTOR'
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })
  if (!esStaff && !esDoctor) redirect('/')

  const sp = await searchParams
  const fecha = sp.fecha ?? fechaLocal(new Date())
  const doctorId = sp.doctorId ? Number(sp.doctorId) : null

  const turnos = await prisma.appointment.findMany({
    where: {
      startAt: { gte: new Date(`${fecha}T00:00:00`), lte: new Date(`${fecha}T23:59:59`) },
      ...(doctorId ? { doctorId } : {}),
    },
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { startAt: 'asc' },
  })

  const medicos = await prisma.doctor.findMany({ include: { user: true }, orderBy: { id: 'asc' } })

  const pendientes = turnos
    .filter((t) => ordenPendiente[t.estado] !== undefined)
    .sort((a, b) => ordenPendiente[a.estado] - ordenPendiente[b.estado] || a.startAt.getTime() - b.startAt.getTime())

  const cerrados = turnos
    .filter((t) => ordenPendiente[t.estado] === undefined)
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())

  const dia = new Date(`${fecha}T12:00:00`)

  const fila = (t: (typeof turnos)[number]) => (
    <tr key={t.id} className="hover:bg-slate-50">
      <td className="px-6 py-4 text-sm text-slate-900">
        {new Date(t.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ({t.durationMin} min)
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">{t.doctor.user.apellido}, {t.doctor.user.nombre}</td>
      <td className="px-6 py-4 text-sm text-slate-900">{t.patient.apellido}, {t.patient.nombre}</td>
      <td className="px-6 py-4 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs ${prioridadColor[t.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
          {t.prioridad.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">{t.estado.replace('_', ' ')}</td>
      <td className="px-6 py-4">{esStaff || doctor?.id === t.doctorId ? <TurnoActions id={t.id} estado={t.estado} /> : null}</td>
    </tr>
  )

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Agenda — {dia.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </h1>

        <form method="get" className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end print:hidden">
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <input name="fecha" type="date" defaultValue={fecha} className="mt-1 block rounded-md border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Médico</label>
            <select name="doctorId" defaultValue={sp.doctorId ?? ''} className="mt-1 block rounded-md border p-2">
              <option value="">Todos</option>
              {medicos.map((m) => <option key={m.id} value={m.id}>{m.user.apellido}, {m.user.nombre}</option>)}
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Ver día</button>
          <a href="/agenda" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Hoy</a>
        </form>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pendientes.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">Sin turnos pendientes para este día.</td></tr>
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
