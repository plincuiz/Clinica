import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import UserEditForm from './UserEditForm'

const LEVEL: Record<string, number> = { SUPER_ADMIN: 3, ADMIN: 2, DOCTOR: 1, SECRETARY: 1 }

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const actorLevel = LEVEL[user.role.name] ?? 0
  if (actorLevel < 2) redirect('/')

  const target = await prisma.user.findUnique({ where: { id: Number(id) }, include: { role: true } })
  if (!target) redirect('/usuarios')

  const puedeEditar = target.id === user.id || actorLevel > (LEVEL[target.role.name] ?? 0)
  if (!puedeEditar) redirect('/usuarios')

  const rolesPermitidos =
    user.role.name === 'SUPER_ADMIN' && ['ADMIN', 'SECRETARY'].includes(target.role.name)
      ? ['ADMIN', 'SECRETARY']
      : []

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Editar Usuario</h1>
        <UserEditForm usuario={target} rolesPermitidos={rolesPermitidos} />
      </div>
    </main>
  )
}
