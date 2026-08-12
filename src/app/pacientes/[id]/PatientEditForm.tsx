'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Plan = { id: number; name: string; active: boolean }
type Obra = { id: number; name: string; plans: Plan[] }

type Pac = {
  id: number
  dni: string
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  direccion: string | null
  fechaNacimiento: string | null
  sexo: string | null
  nroAfiliado: string | null
  healthInsurerId: number
  planId: number | null
}

export default function PatientEditForm({ paciente, obras }: { paciente: Pac; obras: Obra[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [obraSel, setObraSel] = useState(paciente.healthInsurerId)

  const planes = obras.find((o) => o.id === obraSel)?.plans.filter((p) => p.active) ?? []

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', patientId: paciente.id, ...data }),
    })

    if (res.ok) router.push('/pacientes')
    else {
      const json = await res.json()
      setError(json.error || 'Error al guardar')
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">DNI</label>
          <input name="dni" defaultValue={paciente.dni} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Sexo</label>
          <select name="sexo" defaultValue={paciente.sexo ?? ''} className="mt-1 block w-full rounded-md border p-2">
            <option value="">-</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre</label>
          <input name="nombre" defaultValue={paciente.nombre} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Apellido</label>
          <input name="apellido" defaultValue={paciente.apellido} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha Nacimiento</label>
          <input name="fechaNacimiento" type="date" defaultValue={paciente.fechaNacimiento ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Teléfono</label>
          <input name="telefono" defaultValue={paciente.telefono ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Dirección</label>
        <input name="direccion" defaultValue={paciente.direccion ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Obra Social</label>
          <select
            name="healthInsurerId"
            required
            defaultValue={paciente.healthInsurerId}
            onChange={(e) => setObraSel(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border p-2"
          >
            {obras.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Plan</label>
          <select name="planId" defaultValue={paciente.planId ?? ''} className="mt-1 block w-full rounded-md border p-2">
            <option value="">Sin plan</option>
            {planes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nro. Afiliado</label>
          <input name="nroAfiliado" defaultValue={paciente.nroAfiliado ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" defaultValue={paciente.email ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex justify-end gap-3 pt-4">
        <a href="/pacientes" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Cancelar</a>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Cambios</button>
      </div>
    </form>
  )
}
