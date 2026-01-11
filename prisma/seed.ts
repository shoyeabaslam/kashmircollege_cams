import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('Seeding database...')

  // Create sample users for each role
  const counselor = await prisma.user.upsert({
    where: { email: 'counselor@cams.com' },
    update: {},
    create: {
      email: 'counselor@cams.com',
      password: await hashPassword('password123'),
      name: 'Admission Counselor',
      role: Role.ADMISSION_COUNSELOR,
    },
  })

  const certificateOfficer = await prisma.user.upsert({
    where: { email: 'certificate@cams.com' },
    update: {},
    create: {
      email: 'certificate@cams.com',
      password: await hashPassword('password123'),
      name: 'Certificate Officer',
      role: Role.CERTIFICATE_OFFICER,
    },
  })

  const accountsOfficer = await prisma.user.upsert({
    where: { email: 'accounts@cams.com' },
    update: {},
    create: {
      email: 'accounts@cams.com',
      password: await hashPassword('password123'),
      name: 'Accounts Officer',
      role: Role.ACCOUNTS_OFFICER,
    },
  })

  const principal = await prisma.user.upsert({
    where: { email: 'principal@cams.com' },
    update: {},
    create: {
      email: 'principal@cams.com',
      password: await hashPassword('password123'),
      name: 'Principal',
      role: Role.PRINCIPAL,
    },
  })

  const director = await prisma.user.upsert({
    where: { email: 'director@cams.com' },
    update: {},
    create: {
      email: 'director@cams.com',
      password: await hashPassword('password123'),
      name: 'Director',
      role: Role.DIRECTOR,
    },
  })

  console.log('Created users:')
  console.log({ counselor, certificateOfficer, accountsOfficer, principal, director })
  console.log('\nDefault password for all users: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

