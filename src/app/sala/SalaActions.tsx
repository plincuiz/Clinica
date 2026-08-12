'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const labels: Record<string, string> = {
  recepcionar: 'Recepcionar',
  atender: 'Atender',
  finalizar: 'Finalizar',
  ausente: 'Ausente',
  cancelar: 'Cancelar',
}

const styles: Record<string, string> = {
  recepcionar: 'bg-blue-600 hover:bg-blue-700',
  atender: 'bg-green-600 hover:bg-green-700',
  finalizar: 'bg-emerald-700 hover:bg-emerald-800',
  ausente: 'bg-orange-500 hover:bg-orange-600',
  cancelar: 'bg-red-600 hover:bg-red-700',
}

export default function SalaActions({ turnoId, acciones }: { turnoId: number; acciones: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  if (acciones.length === 0) return null

  async function run(accion: string) {
    setBusy(true)
    const res = await fetch(`/api/appointments/${turnoId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion }),
    })
    if (accion === 'atender' && res.ok) {
      const json = await res.json().catch(() => null)
      if (json?.consultaId) {
        router.push(`/consultas/${json.consultaId}`)
        return
      }
    }
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="flex gap-2">
      {acciones.map((a) => (
        <button
          key={a}
          disabled={busy}
          onClick={() => run(a)}
          className={`${styles[a]} text-white text-xs px-2 py-1 rounded disabled:opacity-50`}
        >
          {labels[a]}
        </button>
      ))}
    </div>
  )
}
