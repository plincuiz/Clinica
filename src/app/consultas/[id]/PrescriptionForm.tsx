'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PrescriptionForm({ consultaId }: { consultaId: number }) {
  const router = useRouter()
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const res = await fetch(`/api/consultations/${consultaId}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      router.push('/sala')
    } else {
      const json = await res.json()
      setError(json.error || 'Error al emitir la receta')
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Nueva Receta</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
        <input name="medicamento" placeholder="Medicamento" required className="rounded-md border p-2" />
        <input name="dosis" placeholder="Dosis (ej: 500 mg)" required className="rounded-md border p-2" />
        <input name="frecuencia" placeholder="Frecuencia (ej: cada 8 h)" required className="rounded-md border p-2" />
        <input name="duracion" placeholder="Duración (ej: 7 días)" required className="rounded-md border p-2" />
        <input name="instrucciones" placeholder="Instrucciones (opcional)" className="col-span-2 rounded-md border p-2" />
        <div className="col-span-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Emitir Receta y volver a Sala</button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  )
}
