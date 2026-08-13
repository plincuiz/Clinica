'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function FinalizarButton({ turnoId }: { turnoId: number | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!turnoId) return null

  async function finalizar() {
    setBusy(true)
    const res = await fetch(`/api/appointments/${turnoId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'finalizar' }),
    })
    if (res.ok) {
      router.push('/sala')
    } else {
      const j = await res.json().catch(() => null)
      alert(j?.error || 'Error al finalizar')
      setBusy(false)
    }
  }

  return (
    <button
      onClick={finalizar}
      disabled={busy}
      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {busy ? 'Finalizando…' : 'Finalizar consulta y volver a Sala'}
    </button>
  )
}
