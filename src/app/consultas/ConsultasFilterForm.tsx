'use client'
import { useRouter } from 'next/navigation'

type Obra = { id: number; name: string }
type Med = { id: number; user: { apellido: string; nombre: string } }
type Pac = { id: number; apellido: string; nombre: string }

export default function ConsultasFilterForm({
  obras,
  medicos,
  pacientes,
  actuales,
}: {
  obras: Obra[]
  medicos: Med[]
  pacientes: Pac[]
  actuales: Record<string, string>
}) {
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget).entries())
    const q = new URLSearchParams()
    if (d.desde) q.set('desde', String(d.desde))
    if (d.hasta) q.set('hasta', String(d.hasta))
    if (d.pacienteId) q.set('pacienteId', String(d.pacienteId))
    if (d.doctorId) q.set('doctorId', String(d.doctorId))
    if (d.obraId) q.set('obraId', String(d.obraId))
    router.push(`/consultas?${q.toString()}`)
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end print:hidden">
      <div>
        <label className="block text-sm font-medium text-slate-700">Desde</label>
        <input name="desde" type="date" defaultValue={actuales.desde ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Hasta</label>
        <input name="hasta" type="date" defaultValue={actuales.hasta ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Paciente</label>
        <select name="pacienteId" defaultValue={actuales.pacienteId ?? ''} className="mt-1 block w-full rounded-md border p-2">
          <option value="">Todos</option>
          {pacientes.map((p) => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Médico</label>
        <select name="doctorId" defaultValue={actuales.doctorId ?? ''} className="mt-1 block w-full rounded-md border p-2">
          <option value="">Todos</option>
          {medicos.map((m) => <option key={m.id} value={m.id}>{m.user.apellido}, {m.user.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Obra Social</label>
        <select name="obraId" defaultValue={actuales.obraId ?? ''} className="mt-1 block w-full rounded-md border p-2">
          <option value="">Todas</option>
          {obras.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="col-span-2 md:col-span-5 flex gap-3">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Filtrar</button>
        <a href="/consultas" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Limpiar (ver hoy)</a>
      </div>
    </form>
  )
}
