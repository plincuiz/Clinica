import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hoy = new Date()
  const start = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const end = new Date(start.getTime() + 86400000)

  const [pacientes, turnosHoy, pendientes] = await Promise.all([
    prisma.patient.count({ where: { active: true } }),
    prisma.appointment.count({ where: { startAt: { gte: start, lt: end } } }),
    prisma.billingEntry.count({ where: { estado: 'pendiente_bono' } }),
  ])

  const rol = user.role.name
  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(rol)

  const cards = [
    { href: '/pacientes', icon: '🧑‍⚕️', title: 'Pacientes', desc: `${pacientes} activos` },
    { href: '/turnos', icon: '📅', title: 'Turnos', desc: `${turnosHoy} hoy` },
    { href: '/sala', icon: '🛋️', title: 'Sala de Espera', desc: 'Atención en vivo' },
    { href: '/consultas', icon: '🩺', title: 'Consultas', desc: 'Atenciones y recetas' },
    ...(rol === 'DOCTOR' ? [{ href: '/pacientes', icon: '📖', title: 'Historia Clínica', desc: 'Por paciente, lista para imprimir' }] : []),
    ...(esStaff
      ? [
          { href: '/liquidaciones', icon: '🧾', title: 'Liquidación', desc: `${pendientes} bonos pendientes` },
          { href: '/reportes', icon: '📊', title: 'Reportes', desc: 'Rendiciones por obra y médico' },
        ]
      : []),
  ]

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <div className="anim-in bg-white rounded-2xl shadow p-6 flex items-center gap-4">
          <img src="/logo.png" alt="" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Panel de Control</h1>
            <p className="text-slate-600">
              Bienvenido, {user.nombre} {user.apellido} ({user.role.name})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {cards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="anim-in bg-white rounded-2xl shadow p-5 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-4"
            >
              <span className="text-3xl">{c.icon}</span>
              <span>
                <span className="block font-semibold text-slate-800">{c.title}</span>
                <span className="block text-sm text-slate-500">{c.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
