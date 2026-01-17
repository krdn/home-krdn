/**
 * Prisma Seed Script
 * 데이터베이스 초기 데이터 생성
 *
 * 실행: npx prisma db seed
 */

import { PrismaClient, Role } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import { config } from 'dotenv'

// 환경 변수 로드 (우선순위: .env.development.local > .env.development > .env)
config({ path: '.env.development.local' })
config({ path: '.env.development' })
config({ path: '.env' })

// Prisma 클라이언트 생성 (seed 전용)
function createPrismaClient(): PrismaClient {
  const dbPath = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  const filePath = dbPath.replace('file:', '')
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath)

  // Prisma 7 어댑터는 config 객체를 받음
  const adapter = new PrismaBetterSqlite3({ url: absolutePath })

  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

async function main() {
  console.log('Seeding database...')

  // 환경변수에서 관리자 정보 로드 (기존 호환)
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (!adminPasswordHash) {
    console.warn('ADMIN_PASSWORD_HASH not set, generating default hash for development')
  }

  // 비밀번호 해시 준비
  const passwordHash = adminPasswordHash || await bcrypt.hash('admin', 10)

  // 기존 관리자 계정을 DB로 마이그레이션
  const adminUser = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      // 환경변수가 설정되어 있으면 비밀번호 업데이트
      ...(adminPasswordHash && { passwordHash: adminPasswordHash }),
    },
    create: {
      id: 'admin-001', // 기존 ID 유지 (JWT 호환)
      email: `${adminUsername}@localhost`,
      username: adminUsername,
      passwordHash,
      role: Role.ADMIN,
      displayName: 'Administrator',
    },
  })

  console.log('Seeded admin user:', adminUser.username)

  // 관리자 기본 설정 생성
  const adminSettings = await prisma.userSettings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      theme: 'dark',
      emailNotifications: true,
      pushNotifications: false,
    },
  })

  console.log('Created admin settings:', adminSettings.id)
  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
