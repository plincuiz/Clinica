'use client'
import { useState } from 'react'

export default function EmailButton({ prescriptionId, emailDefault }: { prescriptionId: number; emailDefault: string }) {
  const [busy, setBusy] = useState(false)

  async function enviar() {
    const para = prompt('¿A qué email se envía la receta?', emailDefault)
    if (!para) return
    setBusy(true)
    const res = await fetch(`/api/prescriptions/${prescriptionId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: para }),
    })
    const json = await res.json().catch(() => null)
    if (res.ok) alert('Receta enviada correctamente.')
    else alert(json?.error || 'Error al enviar')
    setBusy(false)
  }

  return (
    <button onClick={enviar} disabled={busy} className="text-emerald-700 underline text-sm disabled:opacity-50">
      {busy ? 'Enviando…' : 'Enviar por email'}
    </button>
  )
}
