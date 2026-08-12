'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const opciones: Record<string, { label: string; estado: string }[]> = {
  listo_para_liquidar: [{ label: 'Liquidar', estado: 'liquidado' }],
  liquidado: [
    { label: 'Marcar Pagado', estado: 'pagado' },
    { label: 'Debitado', estado: 'debitado' },
  ],
  pagado: [{ label: 'Debitado', estado: 'debitado' }],
}

export default function BillingActions({ billingId, estado }: { billingId: number; estado: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const acts = opciones[estado] ?? []
  if (acts.length === 0) return null

  async function run(estadoNuevo: string) {
    setBusy(true)
    await fetch(`/api/billing/${billingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'estado', estado: estadoNuevo }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="flex gap-2">
      {acts.map((a) => (
        <button
          key={a.estado}
          disabled={busy}
          onClick={() => run(a.estado)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
