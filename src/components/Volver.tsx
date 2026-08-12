'use client'
import { useRouter } from 'next/navigation'

export function Volver() {
  const router = useRouter()
  return (
    <div className="p-4 pb-0 print:hidden">
      <button onClick={() => router.back()} className="text-sm text-blue-700 hover:underline">
        ← Volver
      </button>
    </div>
  )
}
