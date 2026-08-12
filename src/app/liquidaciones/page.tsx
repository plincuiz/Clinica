import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import BonoForm from './BonoForm'
import BillingActions from './BillingActions'

export const dynamic = 'force-dynamic'

const estadoLabel: Record<string, string> = {
  pendiente_bono: 'Pendiente de bono',
  listo_para_liquidar: 'Listo para liquidar',
  liquidado: 'Liquidado',
  pagado: 'Pagado',
  debitado: 'Debitado',
}

export default async function LiquidacionesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)) redirect('/')

  const pendientes = await prisma.billingEntry.findMany({
    where: { estado: 'pendiente_bono' },
    include: { patient: true, doctor: { include: { user: true } }, healthInsurer: true, plan: true },
    orderBy: { createdAt: 'desc' },
  })

  const resto = await prisma.billingEntry.findMany({
    where: { estado: { not: 'pendiente_bono' } },
    include: { patient: true, doctor: { include: { user: true } }, healthInsurer: true, plan: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 space-y-8">
        <section>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Liquidaciones</h1>
          <h2 className="text-lg font-semibold text-orange-600 mb-3">
            Pendientes de carga de bono/orden ({pendientes.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Médico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Obra Social</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Cargar bono</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendientes.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No hay pendientes. ¡Todo al día!</td></tr>
                )}
                {pendientes.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{new Date(b.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{b.patient.apellido}, {b.patient.nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{b.doctor.user.apellido}, {b.doctor.user.nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{b.healthInsurer.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{b.plan?.name ?? "-"}</td>
                    <td className="px-6 py-4"><BonoForm billingId={b.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">En proceso de liquidación</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Obra Social</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nro Orden</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {resto.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-4 text-center text-slate-500">Sin registros.</td></tr>
                )}
                {resto.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{new Date(b.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{b.patient.apellido}, {b.patient.nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{b.healthInsurer.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{b.plan?.name ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{b.nroOrdenBono ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">${b.monto.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{estadoLabel[b.estado] ?? b.estado}</td>
                    <td className="px-6 py-4"><BillingActions billingId={b.id} estado={b.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
