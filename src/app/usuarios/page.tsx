import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import UserActions from './UserActions'

export const dynamic = 'force-dynamic'

const LEVEL: Record<string, number> = { SUPER_ADMIN: 3, ADMIN: 2, DOCTOR: 1, SECRETARY: 1 }

export default async function UsuariosPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const actorLevel = LEVEL[user.role.name] ?? 0
  if (actorLevel < 2) redirect('/')

  const usuarios = await prisma.user.findMany({ include: { role: true }, orderBy: { id: 'asc' } })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <Link href="/usuarios/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Nuevo Usuario
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Apellido y Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {usuarios.map((u) => {
                const targetLevel = LEVEL[u.role.name] ?? 0
                const puedeEditar = u.id === user.id || actorLevel > targetLevel
                const puedeToggle = actorLevel > targetLevel
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{u.dni}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{u.apellido}, {u.nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.role.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {puedeEditar && (
                          <Link href={`/usuarios/${u.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
                            Editar
                          </Link>
                        )}
                        {puedeToggle && <UserActions userId={u.id} active={u.active} />}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
