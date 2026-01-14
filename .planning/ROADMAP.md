# Roadmap: Home-KRDN

## Overview

홈서버 통합 대시보드를 보안이 강화되고, 코드 품질이 개선되며, 사용자 경험이 향상된 프로덕션 레디 시스템으로 발전시키는 여정입니다.

## Domain Expertise

None

## Milestones

- ✅ **v1.0 MVP** - Phases 1-8 (shipped 2026-01-15)
- 🚧 **v1.1 Enhancement** - Phases 9-16 (in progress)

## Completed Milestones

### v1.0 MVP ✅ (2026-01-15)

<details>
<summary>8 phases completed - click to expand</summary>

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Security Foundation - API 인증 시스템 | ✅ Complete |
| 2 | Code Quality - 중복 제거, 타입 안전성 | ✅ Complete |
| 3 | Testing Infrastructure - Vitest 테스트 환경 | ✅ Complete |
| 4 | UI/UX Enhancement - 모던 인터페이스 | ✅ Complete |
| 5 | Monitoring Upgrade - 메트릭 시각화 | ✅ Complete |
| 6 | Performance Optimization - 캐싱, 번들 최적화 | ✅ Complete |
| 7 | Alert System - 실시간 알림/경고 | ✅ Complete |
| 8 | Project Gallery - 작업물 전시 | ✅ Complete |

**Key Accomplishments:**
- JWT 인증 시스템 구현
- Vitest 테스트 인프라 구축
- 디자인 시스템 + 애니메이션
- 히스토리 차트 시각화
- 알림 규칙 + 전송 채널
- 프로젝트 갤러리 + 이미지 최적화

See: [v1.0-MVP.md](milestones/v1.0-MVP.md)

</details>

## 🚧 v1.1 Enhancement (In Progress)

**Milestone Goal:** 실시간 업데이트(WebSocket), 외부 알림 채널(이메일/Slack), 프로젝트 관리 Admin 기능 추가

### Phase 9: WebSocket Infrastructure ✅
**Goal**: WebSocket 서버/클라이언트 기반 설정 및 연결 관리
**Depends on**: v1.0 complete
**Status**: Complete (2026-01-15)

Plans:
- [x] 09-01: WebSocket Server Infrastructure (ws + next-ws, UPGRADE handler)
- [x] 09-02: WebSocket Client Hook (useWebSocket, reconnection, heartbeat)

### Phase 10: Real-time Metrics ✅
**Goal**: 시스템 메트릭(CPU, 메모리, 디스크)을 WebSocket으로 실시간 스트리밍
**Depends on**: Phase 9
**Research**: Unlikely (내부 패턴 - 기존 메트릭 수집 로직 활용)
**Status**: Complete (2026-01-15)

Plans:
- [x] 10-01: Real-time Metrics Streaming (서버 브로드캐스트 + useRealtimeMetrics 훅)

### Phase 11: Real-time Containers ✅
**Goal**: Docker 컨테이너 상태 변경을 실시간으로 클라이언트에 푸시
**Depends on**: Phase 10
**Research**: Unlikely (내부 패턴 - Docker Events API 활용)
**Status**: Complete (2026-01-15)

Plans:
- [x] 11-01: Real-time Containers Streaming (서버 브로드캐스트 + useRealtimeContainers 훅)

### Phase 12: Email Notification ✅
**Goal**: 이메일 알림 채널 구현 (임계값 초과 시 이메일 발송)
**Depends on**: Phase 9
**Status**: Complete (2026-01-15)

Plans:
- [x] 12-01: 이메일 알림 채널 (Resend API, 설정 UI, 훅 통합)

### Phase 13: Slack Integration ✅
**Goal**: Slack 웹훅을 통한 알림 전송 기능 구현
**Depends on**: Phase 12
**Status**: Complete (2026-01-15)

Plans:
- [x] 13-01: Slack 웹훅 알림 채널 (Block Kit 메시지, 설정 UI, 훅 통합)

### Phase 14: Project Admin CRUD ✅
**Goal**: 프로젝트 생성/수정/삭제 기능 (Admin 전용)
**Depends on**: Phase 9
**Research**: Unlikely (CRUD 패턴 - 기존 API 패턴 활용)
**Status**: Complete (2026-01-15)

Plans:
- [x] 14-01: Project Admin CRUD (JSON 저장소, REST API, Admin UI)

### Phase 15: Admin Dashboard ✅
**Goal**: 관리자 대시보드 UI (프로젝트 관리, 알림 설정 통합)
**Depends on**: Phase 14
**Research**: Unlikely (UI 패턴 - 기존 컴포넌트 활용)
**Status**: Complete (2026-01-15)

Plans:
- [x] 15-01: Admin Dashboard UI (Sidebar 확장, Quick Access, AdminOverview)

### Phase 16: E2E Testing
**Goal**: Playwright E2E 테스트 환경 구축 및 핵심 플로우 테스트
**Depends on**: Phase 15
**Research**: Likely (Playwright 설정 - Next.js 16 통합)
**Research topics**: Playwright + Next.js, 테스트 전략, CI 통합
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. WebSocket Infrastructure | v1.1 | 2/2 | ✅ Complete | 2026-01-15 |
| 10. Real-time Metrics | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 11. Real-time Containers | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 12. Email Notification | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 13. Slack Integration | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 14. Project Admin CRUD | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 15. Admin Dashboard | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 16. E2E Testing | v1.1 | 0/? | Not started | - |
