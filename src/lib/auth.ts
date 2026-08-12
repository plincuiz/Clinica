import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

export const COOKIE_NAME = 'clinica_session'

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('Falta AUTH_SECRET en .env')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex')
}

export function createSessionToken(userId: number): string {
  const exp = Date.now() + 8 * 60 * 60 * 1000
  const payload = `${userId}.${exp}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, exp, sig] = parts
  const expected = sign(`${userId}.${exp}`)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!timingSafeEqual(a, b)) return null
  if (Number(exp) < Date.now()) return null
  return { userId: Number(userId) }
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value)
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { role: true },
  })
  if (!user || !user.active) return null
  return user
}
