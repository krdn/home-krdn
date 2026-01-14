# Home-KRDN

## What This Is

홈서버의 모든 서비스, 컨테이너, 시스템 리소스를 한눈에 파악하고 관리할 수 있는 통합 대시보드입니다. Next.js 16 기반으로 구축되어 실시간 모니터링과 Docker 컨테이너 제어 기능을 제공합니다.

## Core Value

**통합 모니터링 허브** — 모든 서비스와 컨테이너를 한눈에 파악하고 관리하는 중앙 대시보드. 이것이 동작하지 않으면 다른 모든 것은 의미가 없다.

## Requirements

### Validated

<!-- 기존 코드베이스에서 추론된 기능들 -->

- ✓ 시스템 메트릭 모니터링 (CPU, 메모리, 디스크, 업타임) — existing
- ✓ Docker 컨테이너 목록 조회 — existing
- ✓ Docker 컨테이너 제어 (시작/중지/재시작) — existing
- ✓ 컨테이너 로그 조회 — existing
- ✓ 서비스 카탈로그 (11개 서비스, 3개 카테고리) — existing
- ✓ 반응형 레이아웃 (모바일/데스크톱 사이드바) — existing
- ✓ 다크/라이트 테마 지원 — existing
- ✓ Docker 기반 프로덕션 배포 — existing

### Active

<!-- 현재 빌드 목표 (가설) -->

- [ ] API 인증 시스템 (보안 취약점 해결)
- [ ] UI/UX 디자인 개선 (모던하고 직관적인 인터페이스)
- [ ] 프로젝트 갤러리 기능 (작업물 전시)
- [ ] 실시간 알림/경고 시스템
- [ ] 모니터링 강화 (상세 메트릭, 히스토리)
- [ ] 테스트 코드 추가 (현재 0% 커버리지)
- [ ] 코드 품질 개선 (중복 제거, 타입 안전성)
- [ ] 성능 최적화 (폴링 개선, 캐싱)

### Out of Scope

<!-- 명시적 경계 -->

- 현재 특별히 제외된 기능 없음 (필요에 따라 추가)

## Context

### 기존 코드베이스 상태

- **기술 스택**: Next.js 16.1.1, React 19.2.3, TypeScript 5.x, Tailwind CSS 4
- **아키텍처**: 7-레이어 구조 (Presentation → API → Service → Type)
- **Docker 통합**: Unix 소켓 기반 직접 통신
- **상태 관리**: Zustand, TanStack Query (설치됨, 일부 미사용)

### 보안 이슈 (CONCERNS.md 참조)

- ⚠️ API 엔드포인트 인증 없음 (HIGH 우선순위)
- ⚠️ 시스템 명령어 입력 검증 미흡
- ⚠️ 테스트 코드 0%

### 코드 품질 이슈

- 중복 함수 (`formatBytes`, `formatUptime` 2곳에 존재)
- `.env.example` 미존재
- 일부 매직 넘버 하드코딩

## Constraints

- **런타임**: Docker 컨테이너 (Node.js 20 Alpine)
- **Docker 접근**: Unix 소켓 (`/var/run/docker.sock`) 필요
- **리소스**: 256MB RAM 제한 (프로덕션)

## Key Decisions

<!-- 프로젝트 진행 중 결정 사항 -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 기존 Next.js 스택 유지 | 이미 구축된 아키텍처 활용, 학습 곡선 최소화 | — Pending |
| 인증 시스템 우선 구현 | 보안 취약점이 가장 긴급한 이슈 | — Pending |
| Brownfield 접근법 | 기존 코드 위에 점진적 개선 | — Pending |

---
*Last updated: 2026-01-14 after initialization*
