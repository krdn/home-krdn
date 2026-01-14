---
phase: 17-database-infrastructure
plan: 01
subsystem: database
requires: []
provides: [prisma-client, user-schema, team-schema]
affects: [18-auth-system-extension, 19-rbac-access-control, 20-user-dashboard-settings, 21-team-features]
tags: [database, prisma, sqlite, schema]
key-decisions:
  - SQLite 파일 DB로 시작 (마이그레이션 용이)
  - Role enum으로 ADMIN/USER/VIEWER 구분
  - UserSettings 분리 (1:1 관계)
  - Prisma 7 어댑터 패턴 (better-sqlite3)
key-files: [prisma/schema.prisma, src/lib/prisma.ts, prisma.config.ts]
tech-stack:
  added: [prisma@7.2.0, @prisma/client@7.2.0, @prisma/adapter-better-sqlite3@7.2.0, better-sqlite3@12.6.0]
  patterns: [singleton-prisma-client, prisma-7-adapter-pattern]
patterns-established:
  - Prisma 싱글톤 패턴 for Next.js hot reload
  - User-Team-TeamMember 관계 모델
  - Prisma-Legacy 타입 호환 매핑
---

# Phase 17 Plan 01: Prisma Setup & Schema Summary

## Accomplishments

- [x] Prisma 7.2.0 설치 및 구성
- [x] User/Team/TeamMember/UserSettings 스키마 설계
- [x] 싱글톤 클라이언트 구현 (better-sqlite3 어댑터)
- [x] Prisma-Legacy 타입 호환 매핑

## Files Created/Modified

| File | Description |
|------|-------------|
| `package.json` | Prisma 의존성 및 db:* scripts 추가 |
| `prisma.config.ts` | Prisma 7 설정 (better-sqlite3 어댑터) |
| `prisma/schema.prisma` | User, Team, TeamMember, UserSettings 모델 |
| `src/lib/prisma.ts` | 싱글톤 PrismaClient (hot reload 대응) |
| `src/types/auth.ts` | Prisma-Legacy 타입 호환 매핑 추가 |
| `.env.example` | DATABASE_URL 환경변수 템플릿 |

## Schema Models

### User
- `id`: cuid
- `email`: unique
- `username`: unique
- `passwordHash`: string
- `role`: Role enum (ADMIN, USER, VIEWER)
- `displayName`, `avatarUrl`: 프로필
- `createdAt`, `updatedAt`, `lastLoginAt`: 타임스탬프

### Team
- `id`: cuid
- `name`, `slug` (unique), `description`
- `ownerId`: User 참조
- `createdAt`, `updatedAt`

### TeamMember (Join Table)
- `id`: cuid
- `userId`, `teamId`: 복합 유니크 제약
- `role`: 팀 내 역할
- `joinedAt`: 가입 시간

### UserSettings (1:1)
- `id`: cuid
- `userId`: unique
- `dashboardLayout`: JSON string
- `theme`: default "dark"
- `emailNotifications`, `pushNotifications`

## Technical Details

### Prisma 7 Changes
- `datasource url`은 `prisma.config.ts`에서 관리
- `PrismaClient` 생성 시 `adapter` 직접 전달
- `previewFeatures: ["driverAdapters"]` 더 이상 필요 없음

### Singleton Pattern
```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Commits

1. `chore(17-01): Prisma 7 + SQLite 의존성 설치`
2. `feat(17-01): Prisma 7 설정 및 싱글톤 클라이언트 구성`
3. `feat(17-01): User, Team, TeamMember, UserSettings 스키마 설계`

## Next Steps

- **17-02-PLAN.md**: 마이그레이션 실행 및 초기 데이터 시드
- **Phase 18**: 인증 시스템 확장 (Prisma User 통합)
- **Phase 19**: RBAC 구현 (Role 기반 권한 검사)
