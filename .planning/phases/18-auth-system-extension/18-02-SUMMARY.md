# Phase 18 Plan 02: Password Reset Summary

**비밀번호 재설정 기능 구현 완료 - PasswordResetToken 모델, 토큰 서비스, 요청/완료 API 포함**

## Accomplishments

- [x] PasswordResetToken 모델 추가 (Prisma 마이그레이션 포함)
- [x] 토큰 서비스 함수 구현 (생성/검증/사용처리/정리)
- [x] 비밀번호 재설정 요청 API 구현 (POST /api/auth/forgot-password)
- [x] 비밀번호 재설정 완료 API 구현 (POST /api/auth/reset-password)

## Files Created/Modified

- `prisma/schema.prisma` - PasswordResetToken 모델 및 User 관계 추가
- `prisma/migrations/20260114234259_add_password_reset_token/migration.sql` - 신규
- `src/lib/user-service.ts` - 토큰 관련 함수 추가 (createPasswordResetToken, findValidPasswordResetToken, markTokenAsUsed, deleteExpiredTokens)
- `src/app/api/auth/forgot-password/route.ts` - 신규
- `src/app/api/auth/reset-password/route.ts` - 신규

## Technical Details

### PasswordResetToken 모델
- `token`: 32바이트 hex 문자열 (crypto.randomBytes)
- `expiresAt`: 생성 시점 + 1시간
- `usedAt`: 사용 시 기록 (1회 사용 제한)
- 인덱스: token, userId

### API 엔드포인트

**POST /api/auth/forgot-password**
- 입력: `{ email: string }`
- 출력: `{ success: true, message: string }`
- 보안: 사용자 존재 여부와 관계없이 동일한 응답 (타이밍 공격 방지)

**POST /api/auth/reset-password**
- 입력: `{ token: string, password: string }`
- 출력: `{ success: true, message: string }` 또는 에러
- 보안: 토큰 1회 사용 후 무효화

### 이메일 발송
- Resend API 사용 (기존 인프라 활용)
- HTML 템플릿 포함 (반응형 디자인)
- 개발 환경에서는 콘솔 로그로 URL 출력

## Decisions Made

1. **토큰 생성 방식**: `crypto.randomBytes(32).toString('hex')` - 64자 hex 문자열
2. **토큰 만료 시간**: 1시간 (보안과 사용성 균형)
3. **기존 토큰 처리**: 새 토큰 생성 시 기존 미사용 토큰 삭제 (중복 방지)
4. **만료 토큰 정리**: `deleteExpiredTokens()` 함수로 배치 처리 가능하도록 설계

## Issues Encountered

None

## Verification Results

- [x] `npm run build` 성공
- [x] `npx prisma validate` 성공
- [x] TypeScript 컴파일 성공

## Next Step

Ready for 18-03-PLAN.md (Role Management)
