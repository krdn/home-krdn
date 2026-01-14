---
phase: 17-database-infrastructure
plan: 02
subsystem: database
requires: [17-01]
provides: [db-migration, user-service, auth-db-layer]
affects: [18-auth-system-extension]
tags: [database, migration, seed, user-service]
key-decisions:
  - 기존 admin-001 ID 유지로 JWT 호환성 확보
  - authenticateUserFromDB vs authenticateUser 병행 운영
  - tsx로 TypeScript 시드 스크립트 실행
  - PrismaBetterSqlite3 어댑터는 config 객체를 받음 (Prisma 7)
key-files: [prisma/seed.ts, src/lib/user-service.ts, prisma/dev.db]
tech-stack:
  added: [tsx@4.21.0]
  patterns: [user-service-layer, db-auth]
patterns-established:
  - User service layer for DB access
  - Prisma seed script pattern
  - Legacy compatibility layer
---

# Phase 17 Plan 02: Migration & Integration Summary

## Accomplishments

- [x] 마이그레이션 실행 및 DB 생성 (`init`)
- [x] 시드 스크립트로 관리자 계정 마이그레이션
- [x] 유저 서비스 레이어 구현
- [x] DB 기반 인증 함수 추가
- [x] 빌드 검증 통과

## Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `prisma/migrations/20260114232655_init/migration.sql` | Created | 초기 마이그레이션 SQL |
| `prisma/migrations/migration_lock.toml` | Created | 마이그레이션 잠금 파일 |
| `prisma/dev.db` | Created | SQLite 데이터베이스 (untracked) |
| `prisma/seed.ts` | Created | 시드 스크립트 (관리자 계정 생성) |
| `prisma.config.ts` | Modified | datasource.url 및 migrations.seed 추가 |
| `src/lib/prisma.ts` | Modified | PrismaBetterSqlite3 어댑터로 업데이트 |
| `src/lib/user-service.ts` | Created | Prisma 기반 유저 서비스 레이어 |
| `src/lib/auth.ts` | Modified | authenticateUserFromDB() 함수 추가 |
| `src/types/auth.ts` | Modified | UserWithTeams 타입 추가 |
| `tsconfig.json` | Modified | prisma.config.ts 빌드 제외 |
| `package.json` | Modified | prisma.seed, tsx 의존성 추가 |

## Technical Details

### Prisma 7 어댑터 변경사항

Prisma 7에서 better-sqlite3 어댑터의 생성 방식이 변경됨:
- 기존: `new PrismaBetterSQLite(Database 인스턴스)`
- 변경: `new PrismaBetterSqlite3({ url: 파일경로 })`

```typescript
// Prisma 7 방식
const adapter = new PrismaBetterSqlite3({ url: absolutePath })
return new PrismaClient({ adapter })
```

### User Service 함수

| 함수 | 설명 |
|------|------|
| `toUserDto(user)` | Prisma User -> Legacy User 변환 |
| `findUserByUsername(username)` | 사용자명으로 조회 |
| `findUserByEmail(email)` | 이메일로 조회 |
| `findUserById(id)` | ID로 조회 |
| `updateLastLogin(userId)` | 로그인 시간 업데이트 |
| `updateUserProfile(userId, data)` | 프로필 업데이트 |
| `updatePasswordHash(userId, hash)` | 비밀번호 해시 업데이트 |

### 인증 함수 병행 운영

| 함수 | 데이터 소스 | 상태 |
|------|------------|------|
| `authenticateUser()` | 환경변수 | Legacy (deprecated) |
| `authenticateUserFromDB()` | Prisma DB | v2.0 (권장) |

## Commits

1. `6b043e3` - `feat(17-02): Prisma 마이그레이션 실행 및 시드 데이터 설정`
2. `d98a004` - `feat(17-02): 유저 서비스 및 인증 호환 레이어 구현`

## Verification Checklist

- [x] `npx prisma migrate status` 마이그레이션 적용 확인
- [x] `prisma/dev.db` 파일 존재
- [x] `npx prisma db seed` 시드 데이터 적용
- [x] `npm run build` 빌드 성공
- [x] `src/lib/user-service.ts` 존재 및 export 확인

## Next Phase

Phase 17 Database Infrastructure 완료. Phase 18 Auth System Extension으로 진행 가능.

### Phase 18 준비사항
- `authenticateUserFromDB()` 로그인 API에 통합
- 사용자 등록 API 구현
- 리프레시 토큰 메커니즘 추가
