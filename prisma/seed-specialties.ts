import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const names = ['Clínica Médica', 'Pediatría', 'Ginecología', 'Cardiología', 'Traumatología', 'Dermatología']
  for (const name of names) {
    await prisma.specialty.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log('Especialidades creadas.')
}
main().finally(async () => await prisma.$disconnect())
