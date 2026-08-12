'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Att = { id: number; fileName: string; sizeBytes: number }

export default function AttachmentsSection({ consultaId, attachments }: { consultaId: number; attachments: Att[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNombre(file.name)
    setBusy(true)
    setError('')
    const fd = new FormData()
    fd.append('archivo', file)
    const res = await fetch(`/api/consultations/${consultaId}/attachments`, { method: 'POST', body: fd })
    if (res.ok) {
      router.refresh()
    } else {
      const j = await res.json()
      setError(j.error || 'Error al subir')
    }
    setBusy(false)
    setNombre('')
    e.target.value = ''
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Estudios adjuntos</h2>
      {attachments.length === 0 && <p className="text-sm text-slate-500">Sin estudios cargados.</p>}
      <div className="space-y-2">
        {attachments.map((a) => (
          <div key={a.id} className="flex justify-between items-center text-sm border-b pb-2">
            <span className="text-slate-700">
              {a.fileName} <span className="text-slate-400">({Math.round(a.sizeBytes / 1024)} KB)</span>
            </span>
            <a className="text-blue-700 underline" href={`/api/attachments/${a.id}`} target="_blank">Ver</a>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer shadow hover:shadow-md">
          📎 Adjuntar estudio
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={onFile}
            disabled={busy}
            className="hidden"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">Formatos permitidos: PDF, PNG, JPG o WEBP — máximo 10 MB.</p>
        {busy && <p className="text-sm text-slate-600 mt-1 font-semibold">Subiendo {nombre}…</p>}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    </section>
  )
}
