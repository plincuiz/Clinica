import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.healthInsurer.upsert({
    where: { name: 'PARTICULAR' },
    update: {},
    create: { name: 'PARTICULAR', active: true },
  })
  console.log('Obra social PARTICULAR creada.')
}
main().finally(async () => await prisma.$disconnect())
