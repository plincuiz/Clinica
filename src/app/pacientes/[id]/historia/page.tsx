import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

export default async function HistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role.name !== 'DOCTOR') redirect('/')

  const paciente = await prisma.patient.findUnique({
    where: { id: Number(id) },
    include: {
      healthInsurer: true,
      consultations: { include: { doctor: { include: { user: true } } }, orderBy: { startAt: 'asc' } },
    },
  })
  if (!paciente) redirect('/pacientes')

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'HISTORIA_PRINT_VIEW', tableName: 'Patient', recordId: paciente.id },
  })

  const porMedico = new Map<string, typeof paciente.consultations>()
  for (const c of paciente.consultations) {
    const k = `${c.doctor.user.apellido}, ${c.doctor.user.nombre}`
    if (!porMedico.has(k)) porMedico.set(k, [])
    porMedico.get(k)!.push(c)
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PrintButton />
      <Volver />
      <div className="p-10 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-center border-b pb-3">Historia Clínica</h1>
        <div className="mt-4 text-sm space-y-1">
          <p>Paciente: <b>{paciente.nombre} {paciente.apellido}</b> (DNI {paciente.dni})</p>
          <p>Fecha de nacimiento: {paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString('es-AR') : '-'}</p>
          <p>Cobertura: {paciente.healthInsurer.name} {paciente.nroAfiliado ? `(Afiliado ${paciente.nroAfiliado})` : ''}</p>
        </div>

        {paciente.consultations.length === 0 && <p className="text-sm mt-8">Sin atenciones registradas.</p>}

        {[...porMedico.entries()].map(([medico, list]) => (
          <div key={medico} className="mt-8">
            <h2 className="text-base font-bold text-teal-700 border-b-2 border-teal-600 pb-1">
              Hoja: Dr/A {medico}
            </h2>
            <div className="mt-3 space-y-4">
              {list.map((c) => (
                <div key={c.id} className="border-b pb-3 text-sm">
                  <p className="font-semibold">
                    {new Date(c.startAt).toLocaleString('es-AR')}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {c.observaciones || [c.evolutionNotes, c.diagnosis, c.treatmentPlan].filter(Boolean).join(', ') || 'Sin observaciones.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="mt-8 text-xs text-slate-500">
          Documento generado el {new Date().toLocaleString('es-AR')} por {user.nombre} {user.apellido}.
        </p>
      </div>
    </main>
  )
}
