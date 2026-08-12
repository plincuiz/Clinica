'use client'
import { useEffect, useState } from 'react'

const opciones = [
  { v: '0', label: 'Desactivado' },
  { v: '5000', label: 'Cada 5 segundos' },
  { v: '10000', label: 'Cada 10 segundos' },
  { v: '15000', label: 'Cada 15 segundos' },
  { v: '30000', label: 'Cada 30 segundos' },
  { v: '60000', label: 'Cada 1 minuto' },
]

export default function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('15000')

  useEffect(() => {
    try {
      const v = localStorage.getItem('clinica_refresh_ms')
      if (v !== null) setVal(v)
    } catch {}
  }, [])

  function change(v: string) {
    setVal(v)
    try {
      localStorage.setItem('clinica_refresh_ms', v)
    } catch {}
  }

  return (
    <div className="fixed bottom-4 left-16 print:hidden z-50">
      {open && (
        <div className="mb-2 bg-white rounded-lg shadow p-4 w-60 space-y-2">
          <p className="text-sm font-semibold text-slate-800">Configuración (esta PC)</p>
          <label className="block text-sm text-slate-600">Refresco automático de pantallas</label>
          <select
            value={val}
            onChange={(e) => change(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          >
            {opciones.map((o) => (
              <option key={o.v} value={o.v}>{o.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Afecta Sala de Espera, Turnos y Liquidación en esta PC.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-slate-700 hover:bg-slate-800 text-white w-10 h-10 rounded-full shadow"
        title="Configuración"
      >
        ⚙
      </button>
    </div>
  )
}
