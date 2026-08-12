'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Plan = { id: number; name: string; active: boolean }

export default function PlansEditor({ insurerId, plans }: { insurerId: number; plans: Plan[] }) {
  const router = useRouter()
  const [name, setName] = useState('')

  async function add() {
    if (!name.trim()) return
    await fetch('/api/insurers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'plan_create', insurerId, name }),
    })
    setName('')
    router.refresh()
  }

  async function toggle(planId: number) {
    await fetch('/api/insurers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'plan_toggle', planId }),
    })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">Planes de la obra social</h2>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del plan" className="border rounded px-3 py-2 w-64" />
        <button onClick={add} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Agregar Plan</button>
      </div>
      {plans.length === 0 && <p className="text-sm text-slate-500">Sin planes cargados.</p>}
      <ul className="space-y-1">
        {plans.map((p) => (
          <li key={p.id} className="flex items-center gap-3 text-sm">
            <span className={p.active ? 'text-slate-800' : 'text-slate-400 line-through'}>{p.name}</span>
            <button
              onClick={() => toggle(p.id)}
              className={`${p.active ? 'bg-orange-500' : 'bg-green-600'} text-white text-xs px-2 py-1 rounded`}
            >
              {p.active ? 'Dar de baja' : 'Reactivar'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
