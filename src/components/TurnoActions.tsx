'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function TurnoActions({ id, estado }: { id: number; estado: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  if (!['programado', 'en_espera'].includes(estado)) return null

  async function cancelar() {
    if (!confirm('¿Cancelar este turno?')) return
    setBusy(true)
    await fetch(`/api/appointments/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancelar' }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="flex gap-2">
      <Link href={`/turnos/${id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
        Editar
      </Link>
      <button
        onClick={cancelar}
        disabled={busy}
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
      >
        Cancelar
      </button>
    </div>
  )
}
