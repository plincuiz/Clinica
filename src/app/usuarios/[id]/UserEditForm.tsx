'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Usuario = {
  id: number
  dni: string
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  role: { name: string }
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARY: 'Secretaría',
}

export default function UserEditForm({ usuario, rolesPermitidos }: { usuario: Usuario; rolesPermitidos: string[] }) {
  const router = useRouter()
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', userId: usuario.id, ...data }),
    })

    if (res.ok) {
      router.push('/usuarios')
    } else {
      const json = await res.json()
      setError(json.error || 'Error al guardar')
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">DNI (login)</label>
          <input name="dni" defaultValue={usuario.dni} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nueva contraseña (opcional)</label>
          <input name="password" type="password" minLength={6} placeholder="Dejar vacío para no cambiar" className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre</label>
          <input name="nombre" defaultValue={usuario.nombre} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Apellido</label>
          <input name="apellido" defaultValue={usuario.apellido} required className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" defaultValue={usuario.email ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Teléfono</label>
          <input name="telefono" defaultValue={usuario.telefono ?? ''} className="mt-1 block w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Rol</label>
          {rolesPermitidos.length > 0 ? (
            <select name="role" defaultValue={usuario.role.name} className="mt-1 block w-full rounded-md border p-2">
              {rolesPermitidos.map((r) => (
                <option key={r} value={r}>{roleLabel[r] ?? r}</option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-sm text-slate-500">{roleLabel[usuario.role.name] ?? usuario.role.name} (no modificable)</p>
          )}
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex justify-end gap-3 pt-4">
        <a href="/usuarios" className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Cancelar</a>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Cambios</button>
      </div>
    </form>
  )
}
