/**
 * Prisma 클라이언트 싱글톤 (Prisma 7)
 *
 * Next.js의 hot reload 시 여러 PrismaClient 인스턴스가 생성되는 것을 방지합니다.
 * 개발 환경에서는 globalThis에 캐시하여 단일 인스턴스를 유지합니다.
 *
 * Prisma 7에서는 better-sqlite3 어댑터를 PrismaClient에 직접 전달합니다.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSQLite } from '@prisma/adapter-better-sqlite3'
import Database from 'better-sqlite3'
import path from 'node:path'

// Global 타입 확장
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma 클라이언트 생성 함수
 */
function createPrismaClient(): PrismaClient {
  // 데이터베이스 파일 경로 설정
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  const dbPath = dbUrl.replace('file:', '')

  // 절대 경로로 변환 (프로젝트 루트 기준)
  const absolutePath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), dbPath)

  // SQLite 데이터베이스 연결
  const sqlite = new Database(absolutePath)

  // Prisma 어댑터 생성
  const adapter = new PrismaBetterSQLite(sqlite)

  // PrismaClient 생성
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

/**
 * Prisma 클라이언트 인스턴스
 *
 * - 개발 환경: globalThis에 캐시하여 hot reload 시에도 단일 인스턴스 유지
 * - 프로덕션 환경: 매번 새 인스턴스 생성 (서버리스 환경 고려)
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 개발 환경에서만 캐시
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
