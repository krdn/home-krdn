# Phase 21-02: Team Invite System Summary

**팀 초대 시스템을 구현하여 이메일 기반 팀 멤버 초대 및 수락 기능 제공**

## Accomplishments

- `TeamInvite` Prisma 모델 추가 (token, email, role, expiresAt, usedAt)
- `Team`, `User` 모델에 초대 관계 추가
- `team-service.ts`에 초대 관련 7개 함수 구현
- `/api/teams/[teamId]/invites` API (GET, POST, DELETE)
- `/api/invites/[token]` API (GET, POST)
- Resend API 이메일 발송 연동 (환경 변수 없으면 스킵)

## Files Created/Modified

- `prisma/schema.prisma` - TeamInvite 모델 추가, Team/User에 관계 추가
- `prisma/migrations/20260115005122_add_team_invite/` - 마이그레이션 파일
- `src/lib/team-service.ts` - 초대 관련 타입, 스키마, 함수 추가 (약 290줄 추가)
- `src/app/api/teams/[teamId]/invites/route.ts` - 초대 목록/생성/취소 API (신규)
- `src/app/api/invites/[token]/route.ts` - 초대 조회/수락 API (신규)

## API Summary

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/teams/[teamId]/invites` | GET | 팀 초대 목록 조회 | ADMIN |
| `/api/teams/[teamId]/invites` | POST | 새 초대 생성 + 이메일 발송 | ADMIN |
| `/api/teams/[teamId]/invites?inviteId=xxx` | DELETE | 초대 취소 | ADMIN |
| `/api/invites/[token]` | GET | 초대 정보 조회 | 공개 |
| `/api/invites/[token]` | POST | 초대 수락 | 인증 |

## Service Functions Added

- `createTeamInvite(teamId, invitedById, input)` - 초대 생성 (7일 만료 토큰)
- `getTeamInvites(teamId)` - 팀의 활성 초대 목록
- `getPendingInvitesByEmail(email)` - 이메일별 대기 초대 목록
- `findValidInvite(token)` - 유효한 초대 토큰 조회
- `acceptInvite(token, userId)` - 초대 수락 (멤버 추가 + 토큰 사용처리)
- `cancelInvite(inviteId)` - 초대 취소 (삭제)
- `deleteExpiredInvites()` - 만료된 초대 정리 (배치용)

## Decisions Made

1. **토큰 만료 기간**: 7일 (PasswordResetToken의 1시간보다 긴 주기)
2. **중복 초대 처리**: 동일 이메일+팀에 대한 기존 미사용 초대는 삭제 후 재생성
3. **이메일 발송**: RESEND_API_KEY 환경 변수 필요, 없으면 콘솔 로그만 출력
4. **초대 정보 조회**: 인증 불필요 (링크 미리보기/공유 고려)
5. **초대 수락**: 반드시 로그인 필요, 트랜잭션으로 멤버 추가 + 토큰 사용처리

## Issues Encountered

- 기존 테스트 파일(`route.test.ts`)의 타입 에러는 Phase 21-01에서 확인된 이전 이슈
- `npm run build` 성공으로 실제 코드의 타입 안전성 검증 완료

## Next Step

Ready for 21-03-PLAN.md (Team Management UI)
