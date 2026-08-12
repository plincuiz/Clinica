import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const dni = String(body?.dni ?? '').trim()
  const password = String(body?.password ?? '')

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  const userAgent = req.headers.get('user-agent') ?? ''

  const user = await prisma.user.findUnique({ where: { dni }, include: { role: true } })

  if (!user || !user.active) {
    return NextResponse.json({ error: 'DNI o contraseña incorrectos' }, { status: 401 })
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({ error: 'Cuenta bloqueada por intentos fallidos. Esperá 5 minutos.' }, { status: 423 })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)

  if (!ok) {
    const failed = user.failedAttempts + 1
    const lock = failed >= 3 ? new Date(Date.now() + 5 * 60 * 1000) : null
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: failed, lockedUntil: lock },
    })
    await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN_FAIL', ip, userAgent } })
    return NextResponse.json({ error: 'DNI o contraseña incorrectos' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  })
  await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN_OK', ip, userAgent } })

  const token = createSessionToken(user.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}
