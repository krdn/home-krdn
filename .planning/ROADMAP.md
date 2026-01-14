# Roadmap: Home-KRDN

## Overview

홈서버 통합 대시보드를 보안이 강화되고, 코드 품질이 개선되며, 사용자 경험이 향상된 프로덕션 레디 시스템으로 발전시키는 여정입니다.

## Domain Expertise

None

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-01-15) — [Archive](milestones/v1.0-MVP.md)
- ✅ **v1.1 Enhancement** — Phases 9-16 (shipped 2026-01-15) — [Archive](milestones/v1.1-Enhancement.md)
- 🚧 **v2.0 Multi-User Foundation** — Phases 17-24 (in progress)

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

### 🚧 v2.0 Multi-User Foundation (In Progress)

**Milestone Goal:** 멀티 유저 인프라 구축 후 PWA 모바일 경험 강화

#### Phase 17: Database Infrastructure

**Goal**: 사용자/팀 데이터 저장을 위한 Prisma + SQLite 기반 DB 인프라 구축
**Depends on**: v1.1 milestone complete
**Research**: Likely (Prisma 설정, 스키마 설계)
**Research topics**: Prisma ORM 설정, Next.js 통합, 마이그레이션 전략
**Plans**: TBD

Plans:
- [ ] 17-01: TBD (run /gsd:plan-phase 17 to break down)

#### Phase 18: Auth System Extension

**Goal**: 회원가입, 비밀번호 찾기, 역할 관리 기능 확장
**Depends on**: Phase 17
**Research**: Likely (기존 jose 확장 또는 next-auth 도입)
**Research topics**: next-auth vs jose 확장 비교, OAuth 제공자 통합 옵션
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

#### Phase 19: RBAC Access Control

**Goal**: 권한 기반 접근 제어 미들웨어 및 라우트 보호 구현
**Depends on**: Phase 18
**Research**: Unlikely (내부 패턴 적용)
**Plans**: TBD

Plans:
- [ ] 19-01: TBD

#### Phase 20: User Dashboard Settings

**Goal**: 개인 위젯 설정, 테마 저장 등 사용자별 대시보드 커스터마이징
**Depends on**: Phase 19
**Research**: Unlikely (내부 패턴 적용)
**Plans**: TBD

Plans:
- [ ] 20-01: TBD

#### Phase 21: Team Features

**Goal**: 팀 생성/초대, 프로젝트 공유, 팀 알림 기능 구현
**Depends on**: Phase 20
**Research**: Unlikely (내부 패턴 적용)
**Plans**: TBD

Plans:
- [ ] 21-01: TBD

#### Phase 22: PWA Foundation

**Goal**: 매니페스트, 서비스워커, 설치 프롬프트로 PWA 기본 인프라 구축
**Depends on**: Phase 21
**Research**: Likely (PWA 설정, Next.js PWA 플러그인)
**Research topics**: next-pwa 또는 Workbox 직접 설정, 매니페스트 구성
**Plans**: TBD

Plans:
- [ ] 22-01: TBD

#### Phase 23: Push Notification

**Goal**: Web Push API 기반 푸시 알림 인프라 및 구독 관리 구현
**Depends on**: Phase 22
**Research**: Likely (Web Push Protocol)
**Research topics**: VAPID 키 설정, 서버 푸시 전송, 구독 저장 전략
**Plans**: TBD

Plans:
- [ ] 23-01: TBD

#### Phase 24: Offline Caching

**Goal**: Workbox 기반 오프라인 캐싱 전략 및 데이터 동기화 구현
**Depends on**: Phase 23
**Research**: Likely (Workbox 설정)
**Research topics**: Workbox 캐싱 전략, 백그라운드 동기화, 충돌 해결
**Plans**: TBD

Plans:
- [ ] 24-01: TBD

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
| 17. Database Infrastructure | v2.0 | 0/? | Not started | - |
| 18. Auth System Extension | v2.0 | 0/? | Not started | - |
| 19. RBAC Access Control | v2.0 | 0/? | Not started | - |
| 20. User Dashboard Settings | v2.0 | 0/? | Not started | - |
| 21. Team Features | v2.0 | 0/? | Not started | - |
| 22. PWA Foundation | v2.0 | 0/? | Not started | - |
| 23. Push Notification | v2.0 | 0/? | Not started | - |
| 24. Offline Caching | v2.0 | 0/? | Not started | - |

---
*Last updated: 2026-01-15 after v2.0 milestone creation*
