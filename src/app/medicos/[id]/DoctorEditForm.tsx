'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Esp = { id: number; name: string }

type Data = {
  doctorId: number
  dni: string
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  specialtyId: number
  matricula: string | null
}

export default function DoctorEditForm({ data, especialidades }: { data: Data; especialidades: Esp[] }) {
  const router = useRouter()
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = Object.fromEntries(new FormData(e.currentTarget).entries())

    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', doctorId: data.doctorId, ...form }),
    })

    if (res.ok) {
      router.push('/medicos')
    } else {
      const json = await res.json()
      setError(json.error || 'Error al guardar')
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">DNI (login)</label>
          <input name="dni" defaultValue={data.dni} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nueva contraseña (opcional)</label>
          <input name="password" type="password" minLength={6} placeholder="Dejar vacío para no cambiar" className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre</label>
          <input name="nombre" defaultValue={data.nombre} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Apellido</label>
          <input name="apellido" defaultValue={data.apellido} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" defaultValue={data.email ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Teléfono</label>
          <input name="telefono" defaultValue={data.telefono ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Especialidad</label>
          <select name="specialtyId" defaultValue={data.specialtyId || ''} required className="mt-1 block w-full rounded-md border p-2">
            <option value="">Seleccionar...</option>
            {especialidades.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Matrícula (opcional)</label>
          <input name="matricula" defaultValue={data.matricula ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex justify-end gap-3 pt-4">
        <a href="/medicos" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Cancelar</a>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Cambios</button>
      </div>
    </form>
  )
}
