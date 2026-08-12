import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { SearchForm } from '@/components/SearchForm'
import { prisma } from '@/lib/prisma'
import PatientActions from './PatientActions'

export const dynamic = 'force-dynamic'

export default async function PacientesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const q = (sp.q ?? '').trim()

  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)

  const where: any = q
    ? { OR: [{ apellido: { contains: q } }, { nombre: { contains: q } }, { dni: { contains: q } }] }
    : {}

  const pacientes = await prisma.patient.findMany({
    where,
    include: { healthInsurer: true },
    orderBy: { apellido: 'asc' },
    take: 200,
  })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <SearchForm placeholder="Buscar por nombre, apellido o DNI" current={q} />
          {esStaff && (
            <Link href="/pacientes/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Nuevo Paciente
            </Link>
          )}
        </div>
        {q && <p className="text-sm text-slate-600 mb-2">Resultados para: “{q}” ({pacientes.length})</p>}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Apellido y Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Obra Social</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pacientes.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No se encontraron pacientes.</td></tr>
              )}
              {pacientes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{p.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{p.apellido}, {p.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.healthInsurer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.telefono || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {(esStaff || user.role.name === 'DOCTOR') && (
                        <Link href={`/pacientes/${p.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
                          {user.role.name === 'DOCTOR' ? 'Historia' : 'Editar'}
                        </Link>
                      )}
                      {esStaff && <PatientActions id={p.id} active={p.active} />}
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
