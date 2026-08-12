import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import AutoRefresh from '@/components/AutoRefresh'
import SettingsPanel from '@/components/SettingsPanel'

const linkCls = 'px-3 py-1.5 rounded-lg font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700'

export async function Navbar() {
  const user = await getSessionUser()
  if (!user) return null

  const rol = user.role.name
  const esAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(rol)
  const esStaff = esAdmin || rol === 'SECRETARY'
  const esDoctor = rol === 'DOCTOR'

  return (
    <>
      <nav className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex gap-1 flex-wrap items-center">
          <Link href="/" className="flex items-center gap-2 mr-3 px-2 py-1.5 rounded-lg hover:bg-teal-50" title="Ir al inicio">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-bold text-teal-700">Clínica</span>
          </Link>
          <Link href="/pacientes" className={linkCls}>Pacientes</Link>
          <Link href="/medicos" className={linkCls}>Médicos</Link>
          {esAdmin && <Link href="/obras" className={linkCls}>Obras Sociales</Link>}
          <Link href="/turnos" className={linkCls}>Turnos</Link>
          <Link href="/agenda" className={linkCls}>Agenda</Link>
          <Link href="/sala" className={linkCls}>Sala de Espera</Link>
          <Link href="/consultas" className={linkCls}>Consultas</Link>
          {esAdmin && <Link href="/usuarios" className={linkCls}>Usuarios</Link>}
          {esStaff && <Link href="/liquidaciones" className={linkCls}>Liquidación</Link>}
          {esStaff && <Link href="/reportes" className={linkCls}>Reportes</Link>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user.nombre} ({user.role.name})</span>
          <a href="/api/logout" className="px-3 py-1.5 rounded-lg font-semibold text-red-600 hover:bg-red-50">
            Salir
          </a>
        </div>
      </nav>
      <AutoRefresh />
      <SettingsPanel />
    </>
  )
}
