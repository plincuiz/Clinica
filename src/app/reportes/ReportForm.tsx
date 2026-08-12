'use client'
import { useRouter } from 'next/navigation'

type Obra = { id: number; name: string }
type Med = { id: number; user: { apellido: string; nombre: string } }

export default function ReportForm({
  obras,
  medicos,
  actuales,
}: {
  obras: Obra[]
  medicos: Med[]
  actuales: Record<string, string>
}) {
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget).entries())
    const q = new URLSearchParams()
    q.set('vista', String(d.vista))
    if (d.desde) q.set('desde', String(d.desde))
    if (d.hasta) q.set('hasta', String(d.hasta))
    if (d.obraId) q.set('obraId', String(d.obraId))
    if (d.doctorId) q.set('doctorId', String(d.doctorId))
    router.push(`/reportes?${q.toString()}`)
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end print:hidden">
      <div>
        <label className="block text-sm font-medium text-slate-700">Tipo</label>
        <select name="vista" defaultValue={actuales.vista ?? 'obra'} className="mt-1 block w-full rounded-md border p-2">
          <option value="obra">Por Obra Social</option>
          <option value="medico">Por Médico</option>
          <option value="general">General</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Desde</label>
        <input name="desde" type="date" defaultValue={actuales.desde ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Hasta</label>
        <input name="hasta" type="date" defaultValue={actuales.hasta ?? ''} className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Obra Social</label>
        <select name="obraId" defaultValue={actuales.obraId ?? ''} className="mt-1 block w-full rounded-md border p-2">
          <option value="">Todas</option>
          {obras.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Médico</label>
        <select name="doctorId" defaultValue={actuales.doctorId ?? ''} className="mt-1 block w-full rounded-md border p-2">
          <option value="">Todos</option>
          {medicos.map((m) => <option key={m.id} value={m.id}>{m.user.apellido}, {m.user.nombre}</option>)}
        </select>
      </div>
      <div className="col-span-2 md:col-span-5">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Generar Reporte</button>
      </div>
    </form>
  )
}
