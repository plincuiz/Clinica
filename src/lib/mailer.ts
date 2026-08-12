import nodemailer from 'nodemailer'

export function mailConfigurado() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'poner-aqui-la-clave')
}

export async function enviarEmail({ para, asunto, html }: { para: string; asunto: string; html: string }) {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
    to: para,
    subject: asunto,
    html,
  })
}
