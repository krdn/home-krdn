# Phase 9 Discovery: WebSocket Infrastructure

**Discovery Level:** 2 (Standard Research)
**Date:** 2026-01-15

## Research Question

Next.js 16에서 WebSocket 실시간 업데이트를 구현하기 위한 최적의 기술 스택 선택

## Options Evaluated

### Option A: Socket.io
- **Pros**: 자동 재연결, rooms/namespaces, 브라우저 fallback, 풍부한 문서
- **Cons**: 추가 오버헤드(~15%), 클라이언트 라이브러리 필요, 단일 사용자 환경에서 과도
- **적합**: 다중 사용자, 채팅, rooms 필요 시

### Option B: ws + next-ws
- **Pros**: 경량, Next.js App Router 통합, UPGRADE 핸들러 직접 사용
- **Cons**: 재연결 로직 수동 구현, 브라우저 호환성 직접 관리
- **적합**: 단일 사용자, 성능 우선, Docker 자체 호스팅

### Option C: Server-Sent Events (SSE)
- **Pros**: 표준 HTTP, 단방향 푸시에 적합, 추가 라이브러리 불필요
- **Cons**: 양방향 통신 불가, 컨테이너 제어 명령 불가
- **적합**: 읽기 전용 실시간 피드

## Decision

**선택: Option B (ws + next-ws)**

### Rationale
1. **Docker 자체 호스팅**: serverless 제약 없음 → ws 직접 사용 가능
2. **단일 사용자 환경**: rooms, namespaces 불필요 → Socket.io 오버헤드 불필요
3. **양방향 필요**: 메트릭 수신 + 컨테이너 제어 명령 발송 → SSE 제외
4. **Next.js 통합**: next-ws로 App Router에서 UPGRADE 핸들러 직접 정의
5. **성능**: 256MB RAM 제한 환경에서 경량 솔루션 우선

### Implementation Approach
```
src/app/api/ws/route.ts       # WebSocket UPGRADE 핸들러
src/lib/websocket-server.ts   # 서버 로직 (연결 관리, 브로드캐스트)
src/hooks/useWebSocket.ts     # 클라이언트 훅 (재연결 로직 포함)
```

## Constraints from Research

1. **next-ws 패치 필요**: `package.json` prepare 스크립트에 `next-ws patch` 추가
2. **재연결 직접 구현**: 클라이언트에서 exponential backoff 재연결 로직 필요
3. **heartbeat 필요**: 연결 상태 확인용 ping/pong 구현

## Sources

- [next-ws GitHub](https://github.com/apteryxxyz/next-ws) - Next.js App Router WebSocket 통합
- [ws vs Socket.io 비교](https://dev.to/alex_aslam/nodejs-websockets-when-to-use-ws-vs-socketio-and-why-we-switched-di9)
- [Real-Time Features in Next.js](https://indusvalley.io/blogs/real-time-features-nextjs-websockets-server-actions)
