import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import TurnoForm from './TurnoForm'

export default async function NuevoTurnoPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })

  const pacientes = await prisma.patient.findMany({ where: { active: true }, orderBy: { apellido: 'asc' } })
  const medicos = await prisma.doctor.findMany({
    where: { active: true },
    include: { user: true, specialties: { include: { specialty: true } } },
  })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Nuevo Turno</h1>
        <TurnoForm pacientes={pacientes} medicos={medicos} medicoFijo={user.role.name === 'DOCTOR' && doctor ? doctor.id : null} />
      </div>
    </main>
  )
}
