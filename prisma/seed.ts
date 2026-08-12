import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Acceso total y auditoría' },
    { name: 'ADMIN', description: 'Administración sin notas médicas' },
    { name: 'SECRETARY', description: 'Recepción, turnos y facturación' },
    { name: 'DOCTOR', description: 'Atención médica' },
  ]
  for (const r of roles) {
    await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r })
  }

  const permissions = [
    'users:read', 'users:write', 'patients:read', 'patients:write',
    'appointments:read', 'appointments:write', 'consultations:read', 'consultations:write',
    'medical_notes:read', 'medical_notes:write', 'prescriptions:read', 'prescriptions:write',
    'billing:read', 'billing:write', 'reports:read', 'audit:read',
  ]
  for (const code of permissions) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code, description: code } })
  }

  const grants: Record<string, string[]> = {
    SUPER_ADMIN: permissions,
    ADMIN: ['patients:read','patients:write','appointments:read','appointments:write','consultations:read','prescriptions:read','billing:read','billing:write','reports:read','audit:read'],
    SECRETARY: ['patients:read','patients:write','appointments:read','appointments:write','prescriptions:read','billing:read','billing:write','reports:read'],
    DOCTOR: ['patients:read','appointments:read','consultations:read','consultations:write','medical_notes:read','medical_notes:write','prescriptions:read','prescriptions:write'],
  }

  for (const [roleName, codes] of Object.entries(grants)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } })
    for (const code of codes) {
      const p = await prisma.permission.findUniqueOrThrow({ where: { code } })
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        update: {},
        create: { roleId: role.id, permissionId: p.id },
      })
    }
  }

  const adminDni = '99999999'
  const adminPass = 'Cambiar123!'
  const role = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } })
  const exists = await prisma.user.findUnique({ where: { dni: adminDni } })

  if (!exists) {
    await prisma.user.create({
      data: {
        dni: adminDni,
        passwordHash: await bcrypt.hash(adminPass, 10),
        nombre: 'Super',
        apellido: 'Admin',
        email: 'admin@localhost',
        roleId: role.id,
      },
    })
    console.log('Usuario admin creado. DNI:', adminDni)
  }
}

main().finally(async () => await prisma.$disconnect())
