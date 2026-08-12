import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import UserForm from './UserForm'

export default async function NuevoUsuarioPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)) redirect('/')

  const roles = user.role.name === 'SUPER_ADMIN' ? ['ADMIN', 'SECRETARY', 'DOCTOR'] : ['SECRETARY', 'DOCTOR']
  const especialidades = await prisma.specialty.findMany({ orderBy: { name: 'asc' } })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Nuevo Usuario</h1>
        <UserForm roles={roles} especialidades={especialidades} />
      </div>
    </main>
  )
}
