'use client'

export default function ExportButton({ params }: { params: Record<string, string> }) {
  function exportar() {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v)
    })
    window.location.href = `/api/reportes/export?${q.toString()}`
  }

  return (
    <button onClick={exportar} className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800">
      📥 Exportar a CSV
    </button>
  )
}
