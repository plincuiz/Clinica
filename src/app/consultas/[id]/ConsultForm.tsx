'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Cons = {
  id: number
  evolutionNotes: string | null
  diagnosis: string | null
  treatmentPlan: string | null
  observaciones: string | null
}

function componer(evolution: string, diagnosis: string, plan: string) {
  return [evolution.trim(), diagnosis.trim(), plan.trim()].filter(Boolean).join(', ')
}

export default function ConsultForm({ consulta }: { consulta: Cons }) {
  const router = useRouter()
  const [evolution, setEvolution] = useState(consulta.evolutionNotes ?? '')
  const [diagnosis, setDiagnosis] = useState(consulta.diagnosis ?? '')
  const [plan, setPlan] = useState(consulta.treatmentPlan ?? '')
  const [obs, setObs] = useState(
    consulta.observaciones ?? componer(consulta.evolutionNotes ?? '', consulta.diagnosis ?? '', consulta.treatmentPlan ?? '')
  )
  const [msg, setMsg] = useState('')

  function updateEvo(v: string) { setEvolution(v); setObs(componer(v, diagnosis, plan)) }
  function updateDiag(v: string) { setDiagnosis(v); setObs(componer(evolution, v, plan)) }
  function updatePlan(v: string) { setPlan(v); setObs(componer(evolution, diagnosis, v)) }

  async function save() {
    setMsg('')
    const res = await fetch(`/api/consultations/${consulta.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evolutionNotes: evolution, diagnosis, treatmentPlan: plan, observaciones: obs }),
    })
    if (res.ok) {
      router.push('/sala')
    } else {
      setMsg('Error al guardar.')
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">Historia Clínica</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700">Evolución (solo médicos)</label>
        <textarea value={evolution} onChange={(e) => updateEvo(e.target.value)} rows={4} className="mt-1 w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Diagnóstico</label>
        <textarea value={diagnosis} onChange={(e) => updateDiag(e.target.value)} rows={2} className="mt-1 w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Plan de tratamiento</label>
        <textarea value={plan} onChange={(e) => updatePlan(e.target.value)} rows={2} className="mt-1 w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Observaciones del día (se autocompleta con lo anterior, separado por comas; podés editarlo)
        </label>
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} className="mt-1 w-full rounded-md border p-2 bg-slate-50" />
      </div>
      <div className="flex gap-3">
        <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar y volver a Sala</button>
        <a href="/sala" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Volver sin guardar</a>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </section>
  )
}
