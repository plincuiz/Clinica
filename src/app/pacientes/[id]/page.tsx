import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import PatientEditForm from './PatientEditForm'

export const dynamic = 'force-dynamic'

export default async function PacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const paciente = await prisma.patient.findUnique({
    where: { id: Number(id) },
    include: { healthInsurer: true },
  })
  if (!paciente) redirect('/pacientes')

  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)
  const esDoctor = user.role.name === 'DOCTOR'
  const puedeEditar = esStaff || esDoctor

  const consultas = esDoctor
    ? await prisma.consultation.findMany({
        where: { patientId: paciente.id },
        include: { doctor: { include: { user: true } } },
        orderBy: { startAt: 'asc' },
      })
    : []

  const porMedico = new Map<string, typeof consultas>()
  for (const c of consultas) {
    const k = `${c.doctor.user.apellido}, ${c.doctor.user.nombre}`
    if (!porMedico.has(k)) porMedico.set(k, [])
    porMedico.get(k)!.push(c)
  }

  const obras = await prisma.healthInsurer.findMany({ where: { active: true }, include: { plans: true }, orderBy: { name: 'asc' } })

  const fechaNacimiento = paciente.fechaNacimiento
    ? new Date(paciente.fechaNacimiento).toISOString().slice(0, 10)
    : null

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {paciente.apellido}, {paciente.nombre}
          </h1>
          {esDoctor && (
            <a href={`/pacientes/${paciente.id}/historia`} target="_blank" className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800">
              Imprimir Historia Clínica
            </a>
          )}
        </div>

        {puedeEditar ? (
          <PatientEditForm paciente={{ ...paciente, fechaNacimiento }} obras={obras} />
        ) : (
          <p className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">
            La carga y edición de pacientes la realiza recepción/administración.
          </p>
        )}

        {esDoctor && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Historia Clínica (por médico)</h2>
            {consultas.length === 0 && <p className="text-sm text-slate-500">Sin atenciones registradas.</p>}
            {[...porMedico.entries()].map(([medico, list]) => (
              <div key={medico} className="mb-5">
                <h3 className="font-semibold text-teal-700 border-b border-teal-200 pb-1 mb-2">
                  Hoja: Dr/A {medico}
                </h3>
                <div className="space-y-3">
                  {list.map((c) => (
                    <div key={c.id} className="text-sm border-b pb-2">
                      <p className="font-medium text-slate-800">{new Date(c.startAt).toLocaleString('es-AR')}</p>
                      <p className="text-slate-600">
                        {c.observaciones || [c.evolutionNotes, c.diagnosis, c.treatmentPlan].filter(Boolean).join(', ') || 'Sin observaciones.'}
                      </p>
                      <a href={`/consultas/${c.id}`} className="text-blue-700 hover:underline">Ver consulta</a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
