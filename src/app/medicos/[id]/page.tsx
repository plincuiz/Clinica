import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import DoctorEditForm from './DoctorEditForm'

export default async function EditarMedicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)) redirect('/medicos')

  const doc = await prisma.doctor.findUnique({
    where: { id: Number(id) },
    include: { user: true, specialties: true },
  })
  if (!doc) redirect('/medicos')

  const especialidades = await prisma.specialty.findMany({ orderBy: { name: 'asc' } })

  const data = {
    doctorId: doc.id,
    dni: doc.user.dni,
    nombre: doc.user.nombre,
    apellido: doc.user.apellido,
    email: doc.user.email,
    telefono: doc.user.telefono,
    specialtyId: doc.specialties[0]?.specialtyId ?? 0,
    matricula: doc.specialties[0]?.matricula ?? null,
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Editar Médico</h1>
        <DoctorEditForm data={data} especialidades={especialidades} />
      </div>
    </main>
  )
}
