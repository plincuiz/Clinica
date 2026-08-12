'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 print:hidden"
    >
      Imprimir
    </button>
  )
}
