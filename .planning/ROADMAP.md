# Roadmap: Home-KRDN

## Overview

홈서버 통합 대시보드를 보안이 강화되고, 코드 품질이 개선되며, 사용자 경험이 향상된 프로덕션 레디 시스템으로 발전시키는 여정입니다.

## Domain Expertise

None

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-01-15) — [Archive](milestones/v1.0-MVP.md)
- ✅ **v1.1 Enhancement** — Phases 9-16 (shipped 2026-01-15) — [Archive](milestones/v1.1-Enhancement.md)
- ✅ **v2.0 Multi-User Foundation** — Phases 17-24 (shipped 2026-01-15) — [Archive](milestones/v2.0-Multi-User-Foundation.md)
- 🚧 **v2.1 Polish** — Phases 25-32 (in progress)

## Completed Milestones

<details>
<summary>✅ v1.0 MVP (Phases 1-8) — SHIPPED 2026-01-15</summary>

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

</details>

<details>
<summary>✅ v1.1 Enhancement (Phases 9-16) — SHIPPED 2026-01-15</summary>

| Phase | Description | Status |
|-------|-------------|--------|
| 9 | WebSocket Infrastructure - 실시간 통신 기반 | ✅ Complete |
| 10 | Real-time Metrics - 메트릭 스트리밍 | ✅ Complete |
| 11 | Real-time Containers - 컨테이너 상태 Push | ✅ Complete |
| 12 | Email Notification - Resend API 이메일 | ✅ Complete |
| 13 | Slack Integration - Block Kit 알림 | ✅ Complete |
| 14 | Project Admin CRUD - JSON 기반 관리 | ✅ Complete |
| 15 | Admin Dashboard - 통합 관리 UI | ✅ Complete |
| 16 | E2E Testing - Playwright 테스트 | ✅ Complete |

**Key Accomplishments:**
- WebSocket 양방향 실시간 통신
- 폴링 → WebSocket 전환 (메트릭/컨테이너)
- 이메일/Slack 외부 알림 채널
- 프로젝트 Admin CRUD 완성
- Playwright E2E 테스트 인프라

</details>

## Progress

**Execution Order:**
All planned phases (1-16) completed.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Security Foundation | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 2. Code Quality | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 3. Testing Infrastructure | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 4. UI/UX Enhancement | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 5. Monitoring Upgrade | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 6. Performance Optimization | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 7. Alert System | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 8. Project Gallery | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 9. WebSocket Infrastructure | v1.1 | 2/2 | ✅ Complete | 2026-01-15 |
| 10. Real-time Metrics | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 11. Real-time Containers | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 12. Email Notification | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 13. Slack Integration | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 14. Project Admin CRUD | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 15. Admin Dashboard | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 16. E2E Testing | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |

### ✅ v2.0 Multi-User Foundation (SHIPPED 2026-01-15)

**Milestone Goal:** 멀티 유저 인프라 구축 후 PWA 모바일 경험 강화

#### Phase 17: Database Infrastructure ✅

**Goal**: 사용자/팀 데이터 저장을 위한 Prisma + SQLite 기반 DB 인프라 구축
**Depends on**: v1.1 milestone complete
**Status**: Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 17-01: Prisma 7 Setup & Schema (User/Team/TeamMember/UserSettings)
- [x] 17-02: Migration & Integration (시드 데이터, user-service)

#### Phase 18: Auth System Extension ✅

**Goal**: 회원가입, 비밀번호 찾기, 역할 관리 기능 확장
**Depends on**: Phase 17
**Research**: Level 1 - Quick Verification (기존 jose 확장 채택)
**Status**: Complete (2026-01-15)
**Plans**: 3/3 complete

Plans:
- [x] 18-01: Core Auth Flow (로그인 DB 전환 + 회원가입)
- [x] 18-02: Password Reset (비밀번호 재설정)
- [x] 18-03: Role Management (역할 관리 API)

#### Phase 19: RBAC Access Control ✅

**Goal**: 권한 기반 접근 제어 미들웨어 및 라우트 보호 구현
**Depends on**: Phase 18
**Research**: Level 0 - Skip (기존 패턴 확장)
**Status**: Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 19-01: RBAC 권한 매트릭스 및 미들웨어 통합
- [x] 19-02: API 라우트 보호 및 프론트엔드 역할 기반 UI

#### Phase 20: User Dashboard Settings ✅

**Goal**: 개인 위젯 설정, 테마 저장 등 사용자별 대시보드 커스터마이징
**Depends on**: Phase 19
**Research**: Unlikely (내부 패턴 적용)
**Status**: Complete (2026-01-15)
**Plans**: 3/3 complete

Plans:
- [x] 20-01: UserSettings 백엔드 서비스 및 API 라우트
- [x] 20-02: 사용자 설정 UI 페이지 및 테마 서버 동기화
- [x] 20-03: 대시보드 위젯 커스터마이징

#### Phase 21: Team Features ✅

**Goal**: 팀 생성/초대, 프로젝트 공유, 팀 알림 기능 구현
**Depends on**: Phase 20
**Research**: Level 0 - Skip (내부 패턴 적용)
**Status**: Complete (2026-01-15)
**Plans**: 4/4 complete

Plans:
- [x] 21-01: Team Service Layer 및 REST API 구현
- [x] 21-02: Team Invite System (초대 토큰, 이메일 발송)
- [x] 21-03: Team Management UI (목록, 상세, 생성, 멤버 관리)
- [x] 21-04: Team Notification Channel (팀 알림 설정)

#### Phase 22: PWA Foundation ✅

**Goal**: 매니페스트, 서비스워커, 설치 프롬프트로 PWA 기본 인프라 구축
**Depends on**: Phase 21
**Research**: Complete (Next.js 16 내장 PWA, direct sw.js 권장)
**Status**: Complete (2026-01-15)
**Plans**: 1/1 complete

Plans:
- [x] 22-01: PWA Manifest, Service Worker, Install Prompt UI

#### Phase 23: Push Notification ✅

**Goal**: Web Push API 기반 푸시 알림 인프라 및 구독 관리 구현
**Depends on**: Phase 22
**Research**: Complete (web-push 라이브러리, VAPID 인증)
**Status**: Complete (2026-01-15)
**Plans**: 1/1 complete

Plans:
- [x] 23-01: VAPID 설정, PushSubscription 모델, 구독 API, 전송 서비스, 클라이언트 UI

#### Phase 24: Offline Caching ✅

**Goal**: 오프라인 캐싱 전략 및 폴백 페이지 구현 (Workbox 미사용, 네이티브 SW)
**Depends on**: Phase 23
**Research**: Complete (네이티브 Service Worker 캐싱 전략 채택)
**Status**: Complete (2026-01-15)
**Plans**: 1/1 complete

Plans:
- [x] 24-01: SW 캐싱 전략 개선, 오프라인 폴백 페이지, 오프라인 상태 UI

### 🚧 v2.1 Polish (In Progress)

**Milestone Goal:** 기존 기능 다듬기 — 테스트 커버리지 확대, 접근성 개선, 에러 처리 표준화, 문서화 강화

#### Phase 25: Test Coverage Expansion ✅

**Goal**: 단위/통합 테스트 커버리지 확대 (핵심 lib 모듈 고커버리지 달성)
**Depends on**: v2.0 milestone complete
**Research**: Unlikely (기존 Vitest 인프라 활용)
**Status**: Complete (2026-01-15)
**Plans**: 4/4 complete

Plans:
- [x] 25-01: Coverage 설정 + alertEngine TDD (19 tests)
- [x] 25-02: RBAC & Auth 단위 테스트 (62 + 39 tests)
- [x] 25-03: Service Layer 테스트 (34 + 26 tests)
- [x] 25-04: API Routes 테스트 (35 tests) + Coverage 검증

**Key Results:**
- 총 테스트: 103개 → 318개 (+215개)
- 핵심 모듈 커버리지: rbac 97%, auth 78%, services 100%, utils 100%

#### Phase 26: E2E Test Activation ✅

**Goal**: Playwright E2E 테스트 활성화 — 인증 플로우 포함, 다중 브라우저 지원
**Depends on**: Phase 25
**Research**: Unlikely (기존 Playwright 설정 확장)
**Status**: Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 26-01: Auth Fixture & Login Flow (31 tests)
- [x] 26-02: Multi-Browser & Admin Tests (18 tests)

**Key Results:**
- 총 E2E 테스트: 67개 (39 passed, 28 skipped - 테스트 사용자 필요)
- 다중 브라우저 지원: Chromium, Firefox, Webkit
- Auth fixture로 인증 상태 재사용 가능

#### Phase 27: Error Handling Standardization ✅

**Goal**: 중앙집중식 에러 핸들링 시스템 — 에러 분류, 사용자 피드백, 로깅 표준화
**Depends on**: Phase 26
**Research**: Unlikely (내부 패턴 적용)
**Status**: ✅ Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 27-01: Error Classes & Central Handler (커스텀 에러 클래스, 중앙 핸들러, 로깅)
- [x] 27-02: API Route Migration & Client Integration (라우트 적용, 클라이언트 유틸)

Results:
- 7개 커스텀 에러 클래스 (AppError, AuthError, ValidationError, NotFoundError, ConflictError, RateLimitError, ExternalServiceError)
- 17개 타입-세이프 에러 코드
- 60개 테스트 (38 서버 + 22 클라이언트)
- Auth/Admin 라우트 마이그레이션 완료

#### Phase 28: Accessibility Enhancement ✅

**Goal**: 접근성 개선 — ARIA 속성, alt 텍스트, 키보드 네비게이션, 포커스 관리
**Depends on**: Phase 27
**Research**: Unlikely (WCAG 가이드라인 적용)
**Status**: ✅ Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 28-01: ARIA Enhancement & Focus Management
- [x] 28-02: Semantic HTML & Motion Accessibility

Results:
- ARIA 속성 50+ 추가 (aria-label, aria-hidden, aria-current, etc.)
- 포커스 트랩 훅 (useFocusTrap)
- 스킵 링크 컴포넌트
- prefers-reduced-motion 지원
- ESLint jsx-a11y 17개 규칙 추가

#### Phase 29: Performance Optimization ✅

**Goal**: 렌더링 최적화 — memo/useMemo 확대, 가상화, 지연 로딩 개선
**Depends on**: Phase 28
**Research**: Unlikely (React 최적화 패턴 적용)
**Status**: ✅ Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 29-01: Memoization & Context Optimization
- [x] 29-02: Virtualization & Lazy Loading

Results:
- ToastProvider, AdminDashboard, AlertHistoryPanel, MetricsCharts 메모이제이션
- @tanstack/react-virtual로 ContainerList/AlertHistoryPanel 가상화
- ProjectForm/AlertRuleForm Dynamic Import

#### Phase 30: Documentation Overhaul ✅

**Goal**: 문서화 강화 — README 개선, API 문서, 개발자 가이드, 아키텍처 다이어그램
**Depends on**: Phase 29
**Research**: Unlikely (내부 문서 작성)
**Status**: ✅ Complete (2026-01-15)
**Plans**: 2/2 complete

Plans:
- [x] 30-01: README.md 재작성 + API 문서화
- [x] 30-02: Wiki 문서 v2.1 업데이트

Results:
- README.md 재작성 (36줄 → 157줄)
- docs/API.md 생성 (30개 엔드포인트 문서화)
- Wiki Home.md, 기술-스택.md v2.1 기준 업데이트

#### Phase 31: Logging Infrastructure ✅

**Goal**: 프로덕션 로깅 시스템 — 구조화된 로그, 컨텍스트 추적, 로그 레벨 관리
**Depends on**: Phase 30
**Research**: Complete (pino 선택 - 성능, JSON 기본, 작은 번들)
**Status**: ✅ Complete (2026-01-15)
**Plans**: 1/1 complete

Plans:
- [x] 31-01: pino 기반 Logger 서비스 구현

Results:
- pino + pino-pretty 설치
- src/lib/logger.ts 중앙집중식 로거 생성
- error-logger.ts pino 마이그레이션
- 환경별 설정 (개발: pretty-print, 프로덕션: JSON)

#### Phase 32: Bundle Analysis & Optimization

**Goal**: 번들 최적화 — 번들 크기 분석, 코드 스플리팅, tree-shaking 개선
**Depends on**: Phase 31
**Research**: Unlikely (기존 analyze 스크립트 활용)
**Status**: Not started
**Plans**: TBD

Plans:
- [ ] 32-01: TBD

## Progress

**Execution Order:**
All planned phases (1-16) completed. v2.0 phases 17-24 in progress.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Security Foundation | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 2. Code Quality | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 3. Testing Infrastructure | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 4. UI/UX Enhancement | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 5. Monitoring Upgrade | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 6. Performance Optimization | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 7. Alert System | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 8. Project Gallery | v1.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 9. WebSocket Infrastructure | v1.1 | 2/2 | ✅ Complete | 2026-01-15 |
| 10. Real-time Metrics | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 11. Real-time Containers | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 12. Email Notification | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 13. Slack Integration | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 14. Project Admin CRUD | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 15. Admin Dashboard | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 16. E2E Testing | v1.1 | 1/1 | ✅ Complete | 2026-01-15 |
| 17. Database Infrastructure | v2.0 | 2/2 | ✅ Complete | 2026-01-15 |
| 18. Auth System Extension | v2.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 19. RBAC Access Control | v2.0 | 2/2 | ✅ Complete | 2026-01-15 |
| 20. User Dashboard Settings | v2.0 | 3/3 | ✅ Complete | 2026-01-15 |
| 21. Team Features | v2.0 | 4/4 | ✅ Complete | 2026-01-15 |
| 22. PWA Foundation | v2.0 | 1/1 | ✅ Complete | 2026-01-15 |
| 23. Push Notification | v2.0 | 1/1 | ✅ Complete | 2026-01-15 |
| 24. Offline Caching | v2.0 | 1/1 | ✅ Complete | 2026-01-15 |
| 25. Test Coverage Expansion | v2.1 | 4/4 | ✅ Complete | 2026-01-15 |
| 26. E2E Test Activation | v2.1 | 2/2 | ✅ Complete | 2026-01-15 |
| 27. Error Handling Standardization | v2.1 | 0/? | Not started | - |
| 28. Accessibility Enhancement | v2.1 | 0/? | Not started | - |
| 29. Performance Optimization | v2.1 | 0/? | Not started | - |
| 30. Documentation Overhaul | v2.1 | 0/? | Not started | - |
| 31. Logging Infrastructure | v2.1 | 0/? | Not started | - |
| 32. Bundle Analysis & Optimization | v2.1 | 0/? | Not started | - |

---
*Last updated: 2026-01-15 after v2.1 Polish milestone creation*
