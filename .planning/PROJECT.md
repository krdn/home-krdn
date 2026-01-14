# Home-KRDN

## What This Is

홈서버의 모든 서비스, 컨테이너, 시스템 리소스를 한눈에 파악하고 관리할 수 있는 통합 대시보드입니다. Next.js 16 기반으로 구축되어 실시간 모니터링과 Docker 컨테이너 제어 기능을 제공합니다.

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

### Active

<!-- 다음 버전 빌드 목표 -->

- [ ] WebSocket 실시간 업데이트 (폴링 대체)
- [ ] 이메일/Slack 알림 채널 추가
- [ ] 프로젝트 관리 CRUD (Admin 페이지)
- [ ] 멀티 유저 지원
- [ ] E2E 테스트 (Playwright)

### Out of Scope

<!-- 명시적 경계 -->

- 모바일 네이티브 앱 (React Native)
- Kubernetes 지원
- 외부 클라우드 서비스 통합

## Context

### 기술 스택 (v1.0)

- **Framework**: Next.js 16.1.1, React 19.2.3
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4, Framer Motion
- **State**: Zustand, TanStack Query
- **Testing**: Vitest
- **Charts**: Recharts
- **Validation**: Zod
- **Auth**: jose (JWT), bcryptjs

### 아키텍처

- **레이어 구조**: Presentation → API → Service → Type
- **Docker 통합**: Unix 소켓 기반 직접 통신
- **파일 구조**: Feature-based 컴포넌트 + 중앙화된 설정

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

---
*Last updated: 2026-01-15 after v1.0 MVP completion*
