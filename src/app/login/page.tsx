'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-teal-100 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="anim-in bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Logo de la clínica" className="h-20 w-20 object-contain" />
          <h1 className="text-xl font-bold text-slate-800 text-center">Sistema de Gestión Clínica</h1>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">DNI</label>
          <input
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600 anim-in">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg py-2.5 disabled:opacity-50 shadow hover:shadow-md"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
