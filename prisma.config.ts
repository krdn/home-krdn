import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// SQLite 데이터베이스 파일 경로
const dbPath = process.env.DATABASE_URL || 'file:./prisma/dev.db'

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: dbPath,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  migrate: {
    adapter: async () => {
      const { PrismaBetterSQLite } = await import('@prisma/adapter-better-sqlite3')
      const Database = (await import('better-sqlite3')).default

      // file: 프리픽스 제거
      const filePath = dbPath.replace('file:', '')
      const db = new Database(filePath)

      return new PrismaBetterSQLite(db)
    },
  },
})
