'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Pac = { id: number; apellido: string; nombre: string; dni: string }
type Med = { id: number; user: { apellido: string; nombre: string }; specialties: { specialty: { name: string } }[] }
type Item = { id: number; startAt: string; durationMin: number; estado: string; paciente: string }
type Turno = {
  id: number
  patientId: number
  doctorId: number
  startAt: string
  durationMin: number
  prioridad: string
  motivo: string | null
}

function fechaLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TurnoForm({
  pacientes,
  medicos,
  medicoFijo,
  turno,
}: {
  pacientes: Pac[]
  medicos: Med[]
  medicoFijo: number | null
  turno?: Turno | null
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const d0 = turno ? new Date(turno.startAt) : null
  const [doctorSel, setDoctorSel] = useState(medicoFijo ? String(medicoFijo) : turno ? String(turno.doctorId) : '')
  const [fecha, setFecha] = useState(d0 ? fechaLocal(d0) : '')
  const [agenda, setAgenda] = useState<Item[]>([])

  useEffect(() => {
    if (!doctorSel || !fecha) {
      setAgenda([])
      return
    }
    fetch(`/api/appointments?doctorId=${doctorSel}&fecha=${fecha}`)
      .then((r) => r.json())
      .then((d) => setAgenda(Array.isArray(d) ? d : []))
      .catch(() => setAgenda([]))
  }, [doctorSel, fecha])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    const res = await fetch(turno ? `/api/appointments/${turno.id}` : '/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turno ? { action: 'update', ...data } : data),
    })

    if (res.ok) {
      router.push('/turnos')
    } else {
      const json = await res.json()
      setError(json.error || 'Error al guardar')
    }
  }

  const horaInit = d0
    ? `${String(d0.getHours()).padStart(2, '0')}:${String(d0.getMinutes()).padStart(2, '0')}`
    : ''

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Paciente</label>
          <select name="patientId" required defaultValue={turno?.patientId ?? ''} className="mt-1 block w-full rounded-md border p-2">
            <option value="">Seleccionar...</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} (DNI {p.dni})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Médico</label>
          {medicoFijo ? (
            <>
              <input type="hidden" name="doctorId" value={medicoFijo} />
              <p className="mt-1 block w-full rounded-md border p-2 bg-slate-50 text-sm">
                {medicos.find((m) => m.id === medicoFijo)?.user.apellido}, {medicos.find((m) => m.id === medicoFijo)?.user.nombre} (vos)
              </p>
            </>
          ) : (
            <select name="doctorId" required defaultValue={turno?.doctorId ?? ''} onChange={(e) => setDoctorSel(e.target.value)} className="mt-1 block w-full rounded-md border p-2">
              <option value="">Seleccionar...</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user.apellido}, {m.user.nombre} — {m.specialties.map((s) => s.specialty.name).join(', ')}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha</label>
          <input name="fecha" type="date" required defaultValue={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Hora</label>
          <input name="hora" type="time" required defaultValue={horaInit} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Duración</label>
          <select name="durationMin" defaultValue={turno?.durationMin ?? 30} className="mt-1 block w-full rounded-md border p-2">
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">60 minutos</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Prioridad</label>
          <select name="prioridad" defaultValue={turno?.prioridad ?? 'control'} className="mt-1 block w-full rounded-md border p-2">
            <option value="control">Control (azul)</option>
            <option value="nueva_atencion">Nueva Atención (verde)</option>
            <option value="urgencia">Urgencia (rojo)</option>
            <option value="derivacion">Derivación (amarillo)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-sm font-semibold text-slate-700 mb-1">Agenda del médico ese día</p>
        {!doctorSel || !fecha ? (
          <p className="text-sm text-slate-500">Elegí médico y fecha para ver los horarios ocupados.</p>
        ) : agenda.length === 0 ? (
          <p className="text-sm text-green-700">Día libre, sin turnos cargados.</p>
        ) : (
          <ul className="text-sm text-slate-600 space-y-1">
            {agenda
              .filter((a) => a.id !== turno?.id)
              .map((a) => (
                <li key={a.id}>
                  {new Date(a.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} a{' '}
                  {new Date(new Date(a.startAt).getTime() + a.durationMin * 60000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — {a.paciente} ({a.estado.replace('_', ' ')})
                </li>
              ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Motivo</label>
        <input name="motivo" defaultValue={turno?.motivo ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex justify-end gap-3 pt-4">
        <a href="/turnos" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Cancelar</a>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {turno ? 'Guardar Cambios' : 'Guardar Turno'}
        </button>
      </div>
    </form>
  )
}
