import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { SearchForm } from '@/components/SearchForm'
import { prisma } from '@/lib/prisma'
import DoctorActions from './DoctorActions'

export const dynamic = 'force-dynamic'

export default async function MedicosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const q = (sp.q ?? '').trim()

  const esAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)

  const where: any = q
    ? { user: { OR: [{ apellido: { contains: q } }, { nombre: { contains: q } }, { dni: { contains: q } }] } }
    : {}

  const medicos = await prisma.doctor.findMany({
    where,
    include: { user: true, specialties: { include: { specialty: true } } },
  })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-800">Médicos</h1>
          <SearchForm placeholder="Buscar por nombre, apellido o DNI" current={q} />
          {esAdmin && (
            <Link href="/medicos/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Nuevo Médico
            </Link>
          )}
        </div>
        {q && <p className="text-sm text-slate-600 mb-2">Resultados para: “{q}” ({medicos.length})</p>}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Apellido y Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Especialidades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Matrícula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                {esAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {medicos.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No se encontraron médicos.</td></tr>
              )}
              {medicos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{m.user.dni}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{m.user.apellido}, {m.user.nombre}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {m.specialties.map((s) => s.specialty.name).join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {m.specialties.map((s) => s.matricula).filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${m.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/medicos/${m.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
                          Editar
                        </Link>
                        <DoctorActions id={m.id} active={m.active} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
