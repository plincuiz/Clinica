'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BonoForm({ billingId }: { billingId: number }) {
  const router = useRouter()
  const [nro, setNro] = useState('')
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')

  async function save() {
    setError('')
    const res = await fetch(`/api/billing/${billingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cargar_bono', nroOrdenBono: nro, monto }),
    })
    if (res.ok) router.refresh()
    else {
      const j = await res.json()
      setError(j.error || 'Error')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input value={nro} onChange={(e) => setNro(e.target.value)} placeholder="Nro orden/bono" className="border rounded px-2 py-1 text-sm w-32" />
      <input value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" type="number" className="border rounded px-2 py-1 text-sm w-24" />
      <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">Cargar</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
