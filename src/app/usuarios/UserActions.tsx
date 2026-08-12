'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function UserActions({ userId, active }: { userId: number; active: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', userId }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`${active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white text-xs px-2 py-1 rounded disabled:opacity-50`}
    >
      {active ? 'Desactivar' : 'Activar'}
    </button>
  )
}
