import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Volver } from '@/components/Volver'
import { prisma } from '@/lib/prisma'
import ConsultForm from './ConsultForm'
import PrescriptionForm from './PrescriptionForm'
import AttachmentsSection from './AttachmentsSection'
import EmailButton from './EmailButton'

export const dynamic = 'force-dynamic'

export default async function ConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const cons = await prisma.consultation.findUnique({
    where: { id: Number(id) },
    include: {
      patient: { include: { healthInsurer: true } },
      doctor: { include: { user: true } },
      prescriptions: { include: { items: true } },
      attachments: true,
    },
  })
  if (!cons) redirect('/consultas')

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })
  const puedeNotas = user.role.name === 'DOCTOR' && doctor?.id === cons.doctorId

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'CONSULT_READ', tableName: 'Consultation', recordId: cons.id },
  })

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <Volver />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold text-slate-800">Consulta</h1>
          <p className="mt-2 text-sm text-slate-600">
            Paciente: <b>{cons.patient.nombre} {cons.patient.apellido}</b> (DNI {cons.patient.dni}) — {cons.patient.healthInsurer.name}
          </p>
          <p className="text-sm text-slate-600">
            Médico: <b>{cons.doctor.user.nombre} {cons.doctor.user.apellido}</b>
          </p>
          <p className="text-sm text-slate-600">
            Inicio: {new Date(cons.startAt).toLocaleString('es-AR')}
          </p>
        </div>

        {puedeNotas ? (
          <ConsultForm consulta={cons} />
        ) : (
          <p className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">
            El contenido clínico está restringido al médico tratante. Solo podés ver y reimprimir recetas.
          </p>
        )}

        {puedeNotas && (
          <AttachmentsSection
            consultaId={cons.id}
            attachments={cons.attachments.map((a) => ({ id: a.id, fileName: a.fileName, sizeBytes: a.sizeBytes }))}
          />
        )}

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Recetas emitidas</h2>
          {cons.prescriptions.length === 0 && <p className="text-sm text-slate-500">Sin recetas.</p>}
          <div className="space-y-2">
            {cons.prescriptions.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-slate-700">
                  {new Date(p.issuedAt).toLocaleString('es-AR')} — {p.items.map((i) => i.medicamento).join(', ')}
                </span>
                <div className="flex gap-4 items-center">
                  {p.token && (
                    <a className="text-blue-700 underline" href={`/receta/${p.token}`} target="_blank">Ver / Imprimir</a>
                  )}
                  <EmailButton prescriptionId={p.id} emailDefault={cons.patient.email ?? ''} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {puedeNotas && <PrescriptionForm consultaId={cons.id} />}
      </div>
    </main>
  )
}
