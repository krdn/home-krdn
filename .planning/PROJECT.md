# Home-KRDN

## What This Is

홈서버의 모든 서비스, 컨테이너, 시스템 리소스를 한눈에 파악하고 관리할 수 있는 통합 대시보드입니다. Next.js 16 기반으로 구축되어 WebSocket 실시간 모니터링, Docker 컨테이너 제어, 다중 채널 알림(Toast/이메일/Slack) 기능을 제공합니다.

## Core Value

**통합 모니터링 허브** — 모든 서비스와 컨테이너를 한눈에 파악하고 관리하는 중앙 대시보드. 이것이 동작하지 않으면 다른 모든 것은 의미가 없다.

## Requirements

### Validated

<!-- v1.0 MVP에서 검증된 기능들 -->

**Core Features (기존)**
- ✓ 시스템 메트릭 모니터링 (CPU, 메모리, 디스크, 업타임) — existing
- ✓ Docker 컨테이너 목록 조회 — existing
- ✓ Docker 컨테이너 제어 (시작/중지/재시작) — existing
- ✓ 컨테이너 로그 조회 — existing
- ✓ 서비스 카탈로그 (11개 서비스, 3개 카테고리) — existing
- ✓ 반응형 레이아웃 (모바일/데스크톱 사이드바) — existing
- ✓ 다크/라이트 테마 지원 — existing
- ✓ Docker 기반 프로덕션 배포 — existing

**v1.0 MVP (신규 구현)**
- ✓ JWT 기반 API 인증 시스템 — Phase 1
- ✓ 중복 코드 제거 및 타입 안전성 강화 (Zod) — Phase 2
- ✓ Vitest 테스트 프레임워크 + 단위/통합 테스트 — Phase 3
- ✓ 디자인 시스템 (색상, 타이포그래피, 컴포넌트) — Phase 4
- ✓ Framer Motion 인터랙션 및 애니메이션 — Phase 4
- ✓ 네트워크/프로세스 상세 메트릭 — Phase 5
- ✓ 메트릭 히스토리 저장 및 Recharts 시각화 — Phase 5
- ✓ React Query 데이터 페칭 최적화 — Phase 6
- ✓ Dynamic Import 번들 최적화 — Phase 6
- ✓ React.memo 렌더링 최적화 — Phase 6
- ✓ Zustand 기반 알림 스토어 및 규칙 엔진 — Phase 7
- ✓ 알림 규칙 설정 UI (임계값 기반) — Phase 7
- ✓ Toast/브라우저 알림 채널 — Phase 7
- ✓ 프로젝트 갤러리 데이터 모델 및 API — Phase 8
- ✓ 프로젝트 카드/상세 페이지 UI — Phase 8
- ✓ Next.js Image 최적화 (shimmer, fallback) — Phase 8

**v1.1 Enhancement (신규 구현)**
- ✓ WebSocket 서버/클라이언트 인프라 (ws + next-ws) — Phase 9
- ✓ WebSocket 재연결 + heartbeat 전략 — Phase 9
- ✓ 실시간 메트릭 스트리밍 (폴링 대체) — Phase 10
- ✓ 실시간 컨테이너 상태 Push — Phase 11
- ✓ 이메일 알림 채널 (Resend API) — Phase 12
- ✓ Slack 웹훅 알림 (Block Kit 메시지) — Phase 13
- ✓ 프로젝트 Admin CRUD (JSON 저장소) — Phase 14
- ✓ Admin Dashboard UI — Phase 15
- ✓ Playwright E2E 테스트 — Phase 16

### Active

<!-- 다음 버전 빌드 목표 -->

- [ ] 멀티 유저 지원
- [ ] PWA 오프라인 지원
- [ ] 대시보드 커스터마이징 (위젯 배치)

### Out of Scope

<!-- 명시적 경계 -->

- 모바일 네이티브 앱 (React Native)
- Kubernetes 지원 (별도 도구 사용)
- 외부 클라우드 서비스 통합

## Context

### 기술 스택 (v1.1)

- **Framework**: Next.js 16.1.1, React 19.2.3
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4, Framer Motion
- **State**: Zustand, TanStack Query
- **Testing**: Vitest, Playwright
- **Charts**: Recharts
- **Validation**: Zod
- **Auth**: jose (JWT), bcryptjs
- **Real-time**: ws, next-ws
- **Notifications**: Resend API, Slack Webhook

### 아키텍처

- **레이어 구조**: Presentation → API → Service → Type
- **Docker 통합**: Unix 소켓 기반 직접 통신
- **WebSocket**: 양방향 실시간 통신 (메트릭, 컨테이너)
- **파일 구조**: Feature-based 컴포넌트 + 중앙화된 설정

### 현재 상태 (v1.1 완료)

- **코드베이스**: 15,718 lines TypeScript
- **테스트**: Vitest 단위/통합 + Playwright E2E
- **파일 수**: ~140 TypeScript 파일
- **마일스톤**: v1.0 MVP + v1.1 Enhancement 완료

## Constraints

- **런타임**: Docker 컨테이너 (Node.js 20 Alpine)
- **Docker 접근**: Unix 소켓 (`/var/run/docker.sock`) 필요
- **리소스**: 256MB RAM 제한 (프로덕션)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JWT 인증 (jose) | NextAuth 대비 경량, 커스텀 로직 용이 | ✅ Validated |
| Vitest over Jest | Next.js 16 호환성, 빠른 실행 속도 | ✅ Validated |
| Zustand 상태 관리 | Redux 대비 간결, 보일러플레이트 최소 | ✅ Validated |
| Recharts 시각화 | React 네이티브, 커스터마이징 용이 | ✅ Validated |
| Dynamic Import | 초기 로드 시간 단축, 코드 분할 | ✅ Validated |
| ws + next-ws | Socket.io 대비 경량, Edge 호환 가능성 | ✅ Validated |
| Resend API | 개발자 친화적, Edge Runtime 호환 | ✅ Validated |
| Slack Block Kit | 시각적으로 풍부한 알림, SDK 불필요 | ✅ Validated |
| JSON 파일 저장 | DB 대비 심플, 소규모 데이터 적합 | ✅ Validated |
| Playwright E2E | Cypress 대비 빠름, 멀티 브라우저 지원 | ✅ Validated |

---
*Last updated: 2026-01-15 after v1.1 milestone*
