'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Initial = {
  id: number
  name: string
  cuit: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
}

export default function ObraForm({ initial }: { initial: Initial | null }) {
  const router = useRouter()
  const [error, setError] = useState('')

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const res = await fetch('/api/insurers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initial ? { action: 'update', id: initial.id, ...data } : data),
    })
    if (res.ok) router.push('/obras')
    else {
      const j = await res.json()
      setError(j.error || 'Error')
    }
  }

  return (
    <form onSubmit={save} className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input name="name" defaultValue={initial?.name ?? ''} placeholder="Nombre *" required className="border rounded px-3 py-2" />
        <input name="cuit" defaultValue={initial?.cuit ?? ''} placeholder="CUIT" className="border rounded px-3 py-2" />
        <input name="direccion" defaultValue={initial?.direccion ?? ''} placeholder="Dirección" className="border rounded px-3 py-2" />
        <input name="telefono" defaultValue={initial?.telefono ?? ''} placeholder="Teléfono" className="border rounded px-3 py-2" />
        <input name="email" type="email" defaultValue={initial?.email ?? ''} placeholder="Email" className="border rounded px-3 py-2" />
      </div>
      <div className="flex items-center gap-3">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          {initial ? 'Guardar Cambios' : 'Agregar Obra Social'}
        </button>
        {initial && <a href="/obras" className="text-sm text-slate-600 hover:underline">Cancelar edición</a>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
}
