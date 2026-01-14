# Phase 9 Plan 01: WebSocket Server Infrastructure Summary

**WebSocket 서버 인프라 구축 완료 - ws 및 next-ws 기반 실시간 통신 기반 마련**

## Accomplishments

### Task 1: 패키지 설치 및 패치 설정
- ws@8.19.0 및 next-ws@2.1.13 설치 완료
- @types/ws 타입 패키지 포함
- package.json에 `prepare` 스크립트 추가 (`next-ws patch`)
- Next.js 16.1.1 패치 성공 적용

### Task 2: WebSocket 타입 및 서버 로직
- `src/types/websocket.ts`: Zod 기반 메시지 스키마 정의
  - 클라이언트 메시지: subscribe, unsubscribe, container-action, ping
  - 서버 메시지: connected, metrics, containers, container-ack, heartbeat, error
  - discriminatedUnion을 사용한 타입 안전한 메시지 라우팅
- `src/lib/websocket-server.ts`: 서버 유틸리티 구현
  - 클라이언트 연결 관리 (Map 기반)
  - 채널별 브로드캐스트 지원
  - 메시지 파싱 및 Zod 검증
  - heartbeat 및 stale 연결 정리

### Task 3: UPGRADE 라우트 핸들러
- `src/app/api/ws/route.ts` 생성
  - next-ws UPGRADE 핸들러 패턴 적용
  - HTTP GET fallback (상태 정보 반환)
  - 연결/해제/에러 이벤트 처리

## Files Created/Modified

| 파일 | 변경 |
|------|------|
| `package.json` | ws, next-ws 의존성 추가, prepare 스크립트 |
| `package-lock.json` | 의존성 잠금 파일 업데이트 |
| `src/types/websocket.ts` | 신규 생성 - WebSocket 메시지 타입 |
| `src/lib/websocket-server.ts` | 신규 생성 - 서버 유틸리티 |
| `src/app/api/ws/route.ts` | 신규 생성 - UPGRADE 핸들러 |

## Decisions Made

1. **Zod discriminatedUnion 사용**: 메시지 타입별 자동 분기 및 타입 추론
2. **Map 기반 클라이언트 관리**: WebSocket → ClientState 매핑으로 효율적 조회
3. **채널 기반 구독 모델**: metrics, containers 채널별 선택적 구독 지원
4. **HTTP GET fallback 추가**: Next.js 빌드 호환성 확보

## Issues Encountered

1. **Next.js 빌드 오류**: UPGRADE 핸들러만 export 시 RouteHandlerConfig 타입 오류 발생
   - 해결: GET 핸들러 추가로 빌드 통과

2. **기존 테스트 파일 타입 오류**: `src/app/api/auth/session/route.test.ts`에 기존 타입 오류 존재
   - 범위 외: 이 플랜에서 수정하지 않음 (별도 이슈로 추적 필요)

## Verification Results

- [x] `npm ls ws next-ws` - 패키지 설치 확인
- [x] `npm run prepare` - 패치 성공
- [x] `npm run build` - 빌드 성공
- [x] TypeScript 컴파일 - WebSocket 관련 오류 없음

## Commits

| Task | Commit Hash | 설명 |
|------|-------------|------|
| Task 1 | 7269fcc | chore(09-01): ws 및 next-ws 패키지 설치 및 패치 설정 |
| Task 2 | 57e705a | feat(09-01): WebSocket 타입 정의 및 서버 핵심 로직 구현 |
| Task 3 | c6f5c56 | feat(09-01): WebSocket UPGRADE 라우트 핸들러 생성 |

## Next Step

Ready for **09-02-PLAN.md** - 클라이언트 훅 구현 (`useWebSocket`)
- 재연결 로직 (exponential backoff)
- React Query 통합
- 기존 폴링 훅과의 호환성 레이어
