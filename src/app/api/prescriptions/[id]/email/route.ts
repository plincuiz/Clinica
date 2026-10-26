import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { mailConfigurado, enviarEmail } from '@/lib/mailer'
import DOMPURIFY from 'dompurify'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })

  const rec = await prisma.prescription.findFirst({
    where: { id: Number(id) },
    include: {
      items: true,
      patient: true,
      doctor: { include: { user: true, specialties: { include: { specialty: true } } } },
    },
  })
  if (!rec) return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })

  const esStaff = ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(user.role.name)
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } })
  const esDueno = user.role.name === 'DOCTOR' && doctor?.id === rec.doctorId
  if (!esStaff && !esDueno) return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })

  if (!mailConfigurado()) {
    return NextResponse.json({
      error: 'El envío de correo no está configurado. Completá EMAIL_HOST, EMAIL_USER y EMAIL_PASS en el archivo .env',
    }, { status: 400 })
  }

  const base = req.headers.get('origin') ?? 'http://localhost:3000'
  const link = rec.token ? `${base}/receta/${rec.token}` : ''

  const safeItems = rec.items.map((i) => ({
    medicamento: DOMPURIFY.sanitize(i.medicamento),
    dosis: DOMPURIFY.sanitize(i.dosis),
    frecuencia: DOMPURIFY.sanitize(i.frecuencia),
    duracion: DOMPURIFY.sanitize(i.duracion),
    instrucciones: i.instrucciones ? DOMPURIFY.sanitize(i.instrucciones) : '',
  }))

  const itemsHtml = safeItems
    .map((i) => `<li><b>${i.medicamento}</b> — ${i.dosis}, ${i.frecuencia}, durante ${i.duracion}${i.instrucciones ? ` (${i.instrucciones})` : ''}</li>`)
    .join('')

  const patientNombre = DOMPURIFY.sanitize(rec.patient.nombre)
  const patientApellido = DOMPURIFY.sanitize(rec.patient.apellido)
  const patientDni = DOMPURIFY.sanitize(rec.patient.dni)
  const doctorNombre = DOMPURIFY.sanitize(rec.doctor.user.nombre)
  const doctorApellido = DOMPURIFY.sanitize(rec.doctor.user.apellido)
  const doctorSpecialty = rec.doctor.specialties.map((s) => DOMPURIFY.sanitize(s.specialty.name)).join(', ') || 'Médico'

const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;padding:24px">
      <h2 style="color:#0f766e">Receta Médica</h2>
      <p>Paciente: <b>${patientNombre} ${patientApellido}</b> (DNI ${patientDni})</p>
      <p>Médico: <b>${doctorNombre} ${doctorApellido}</b> — ${doctorSpecialty}</p>
      <p>Fecha: ${new Date(rec.issuedAt).toLocaleDateString('es-AR')}</p>
      <ul style="line-height:1.7">${itemsHtml}</ul>
      ${link ? `<p><a href="${link}">Ver receta online (válida 30 días)</a></p>` : ''}
      <p style="color:#888;font-size:12px">Enviado por el Sistema de Gestión Clínica.</p>
    </div>
  `

  try {
    await enviarEmail({ para: email, asunto: `Receta médica — ${rec.patient.apellido}, ${rec.patient.nombre}`, html })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo enviar el correo. Revisá la configuración SMTP en .env' }, { status: 500 })
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'PRESCRIPTION_EMAIL', tableName: 'Prescription', recordId: rec.id, details: email },
  })

  return NextResponse.json({ ok: true })
}
