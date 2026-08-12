import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import PatientForm from './PatientForm'

export default async function NuevoPacientePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const obras = await prisma.healthInsurer.findMany({ where: { active: true }, include: { plans: true }, orderBy: { name: "asc" } })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Nuevo Paciente</h1>
        <PatientForm obras={obras} />
      </div>
    </main>
  )
}
