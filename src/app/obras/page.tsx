import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { SearchForm } from '@/components/SearchForm'
import { prisma } from '@/lib/prisma'
import ObraForm from './ObraForm'
import ObraActions from './ObraActions'
import PlansEditor from './PlansEditor'

export const dynamic = 'force-dynamic'

export default async function ObrasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)) redirect('/')

  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const editarId = sp.editar ? Number(sp.editar) : null
  const editing = editarId
    ? await prisma.healthInsurer.findUnique({ where: { id: editarId }, include: { plans: true } })
    : null

  const where: any = q
    ? { OR: [{ name: { contains: q } }, { cuit: { contains: q } }] }
    : {}

  const obras = await prisma.healthInsurer.findMany({ where, include: { plans: true }, orderBy: { name: 'asc' } })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-800">Obras Sociales</h1>
          <SearchForm placeholder="Buscar por nombre o CUIT" current={q} />
        </div>
        {q && <p className="text-sm text-slate-600">Resultados para: “{q}” ({obras.length})</p>}
        <ObraForm
          initial={
            editing
              ? { id: editing.id, name: editing.name, cuit: editing.cuit, direccion: editing.direccion, telefono: editing.telefono, email: editing.email }
              : null
          }
        />
        {editing && <PlansEditor insurerId={editing.id} plans={editing.plans} />}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">CUIT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Planes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {obras.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No se encontraron obras sociales.</td></tr>
              )}
              {obras.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{o.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{o.cuit ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{o.telefono ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{o.plans.filter((p) => p.active).map((p) => p.name).join(', ') || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${o.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {o.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/obras?editar=${o.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
                        Editar
                      </Link>
                      <ObraActions id={o.id} active={o.active} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
