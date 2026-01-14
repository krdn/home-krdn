# Phase 9 Plan 02: WebSocket Client Hook Summary

**WebSocket 클라이언트 인프라 구축 완료 - 자동 재연결, heartbeat, 타입 안전한 메시지 처리를 갖춘 React 훅 구현**

## Accomplishments

### Task 1: WebSocket 상수 및 클라이언트 유틸리티 구현
- `src/config/constants.ts`에 WEBSOCKET_CONFIG 추가
  - RECONNECT_INTERVAL: 3000ms (재연결 기본 간격)
  - MAX_RECONNECT_ATTEMPTS: 10 (최대 재연결 시도)
  - HEARTBEAT_INTERVAL: 30000ms (heartbeat 주기)
  - HEARTBEAT_TIMEOUT: 5000ms (heartbeat 응답 타임아웃)
  - MAX_RECONNECT_DELAY: 30000ms (최대 재연결 대기)
- `src/lib/websocket-client.ts` 신규 생성
  - `getWebSocketUrl()`: HTTPS/HTTP 기반 wss://ws:// 자동 감지
  - `createMessage()`: 타입 안전한 클라이언트 메시지 생성
  - 편의 함수: `createSubscribeMessage`, `createUnsubscribeMessage`, `createPingMessage`, `createContainerActionMessage`
  - `parseMessage()`: Zod 검증 기반 서버 메시지 파싱
  - `calculateBackoff()`: exponential backoff 지연 계산

### Task 2: useWebSocket 훅 구현
- `src/hooks/useWebSocket.ts` 신규 생성
- **핵심 기능**:
  1. **자동 재연결**: 연결 끊김 시 exponential backoff로 재연결
     - 첫 시도: 3초 후
     - 이후: 3초 × 2^(시도횟수), 최대 30초
     - MAX_RECONNECT_ATTEMPTS (10회) 초과 시 중단
  2. **Heartbeat 메커니즘**:
     - 30초마다 ping 전송
     - 5초 내 pong 미수신 시 연결 재시도
  3. **메시지 핸들링**:
     - 타입별 메시지 처리 (onMessage 콜백)
     - 메시지 히스토리 유지 (최근 N개)
  4. **정리(Cleanup)**:
     - 컴포넌트 언마운트 시 연결 종료
     - 모든 타이머 정리
- **타입 가드 헬퍼**:
  - `isMetricsMessage`, `isContainersMessage`, `isContainerAckMessage`, `isErrorMessage`

### Task 3: Human Verification Checkpoint
- **Skipped** (config: skip_checkpoints: true)

## Files Created/Modified

| 파일 | 변경 |
|------|------|
| `src/config/constants.ts` | WEBSOCKET_CONFIG 상수 추가 |
| `src/lib/websocket-client.ts` | 신규 생성 - 클라이언트 유틸리티 |
| `src/hooks/useWebSocket.ts` | 신규 생성 - React 훅 |

## Decisions Made

1. **SSR 안전 처리**: `typeof window === 'undefined'` 체크로 서버 렌더링 시 안전하게 처리
2. **ref 기반 인스턴스 관리**: WebSocket, 타이머를 useRef로 관리하여 불필요한 리렌더링 방지
3. **수동 연결 플래그**: `manualDisconnectRef`로 의도적 종료와 에러 종료 구분
4. **타입 가드 헬퍼 제공**: discriminatedUnion 메시지를 컴포넌트에서 쉽게 분기 처리

## Issues Encountered

1. **기존 테스트 파일 타입 오류**: `src/app/api/auth/session/route.test.ts`에 기존 타입 오류 존재
   - 범위 외: 이 플랜에서 수정하지 않음 (09-01에서 이미 식별됨)

## Verification Results

- [x] `npx tsc --noEmit` - 새 파일에 오류 없음 (기존 테스트 파일 제외)
- [x] `npm run build` - 빌드 성공
- [x] constants.ts에 WEBSOCKET_CONFIG export 확인
- [x] websocket-client.ts 유틸리티 함수 구현 완료
- [x] useWebSocket 훅 구현 완료

## Commits

| Task | Commit Hash | 설명 |
|------|-------------|------|
| Task 1 | 82f06e2 | feat(09-02): WebSocket 상수 및 클라이언트 유틸리티 구현 |
| Task 2 | 4992585 | feat(09-02): useWebSocket 훅 구현 (재연결 + heartbeat) |

## Next Step

**Phase 9 완료** - WebSocket 인프라 구축 완료

다음 단계 (Phase 10: Real-time Metrics):
- `useWebSocket` 훅을 활용한 실시간 메트릭 스트리밍 구현
- 기존 폴링 기반 `useSystemMetrics`를 WebSocket으로 전환
- 컨테이너 목록 실시간 업데이트
