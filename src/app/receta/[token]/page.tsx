import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RecetaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const rec = await prisma.prescription.findFirst({
    where: { token },
    include: {
      patient: true,
      doctor: { include: { user: true, specialties: { include: { specialty: true } } } },
      items: true,
    },
  })

  if (!rec || rec.status === 'anulada' || rec.expiresAt < new Date()) notFound()

  return (
    <main className="min-h-screen bg-white p-10 text-slate-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-center border-b pb-3">Receta Médica</h1>
        <p className="mt-4 text-sm">{new Date(rec.issuedAt).toLocaleDateString('es-AR')}</p>
        <p className="mt-4">
          Paciente: <b>{rec.patient.nombre} {rec.patient.apellido}</b> (DNI {rec.patient.dni})
        </p>
        <p>
          Médico: <b>{rec.doctor.user.nombre} {rec.doctor.user.apellido}</b> —{' '}
          {rec.doctor.specialties.map((s) => `${s.specialty.name}${s.matricula ? ` (MP ${s.matricula})` : ''}`).join(', ') || 'Médico'}
        </p>
        <div className="mt-6 space-y-4">
          {rec.items.map((i) => (
            <div key={i.id} className="border-b pb-2">
              <p className="font-semibold">{i.medicamento} — {i.dosis}</p>
              <p className="text-sm">{i.frecuencia} durante {i.duracion}</p>
              {i.instrucciones && <p className="text-sm text-slate-600">{i.instrucciones}</p>}
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-slate-500">
if          Para imprimir presioná Ctrl + P. Código de verificación: {rec.token.slice(0, 8)}
        </p>
      </div>
    </main>
  )
}
