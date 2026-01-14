# Roadmap: Home-KRDN

## Overview

홈서버 통합 대시보드를 보안이 강화되고, 코드 품질이 개선되며, 사용자 경험이 향상된 프로덕션 레디 시스템으로 발전시키는 여정입니다. 먼저 보안 취약점을 해결하고, 기술 부채를 청산한 뒤, 새로운 기능을 추가합니다.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security Foundation** - API 인증 시스템 구현으로 보안 취약점 해결
- [x] **Phase 2: Code Quality** - 중복 제거, 타입 안전성 강화, 코드 정리
- [x] **Phase 3: Testing Infrastructure** - 테스트 프레임워크 설정 및 핵심 기능 테스트
- [x] **Phase 4: UI/UX Enhancement** - 모던하고 직관적인 인터페이스 개선
- [x] **Phase 5: Monitoring Upgrade** - 상세 메트릭, 히스토리, 시각화 강화
- [x] **Phase 6: Performance Optimization** - 폴링 개선, 캐싱, 리소스 최적화
- [x] **Phase 7: Alert System** - 실시간 알림/경고 시스템 구현
- [x] **Phase 8: Project Gallery** - 작업물 전시 기능 추가

## Phase Details

### Phase 1: Security Foundation
**Goal**: API 엔드포인트에 인증을 추가하여 보안 취약점 해결
**Depends on**: Nothing (first phase)
**Research**: Likely (authentication system, technology choice)
**Research topics**: NextAuth vs custom JWT, middleware patterns, API route protection
**Plans**: 3 plans

Plans:
- [x] 01-01: 인증 인프라 설정 (jose, bcryptjs, JWT 유틸리티) ✓
- [x] 01-02: 인증 API 엔드포인트 (login, session, logout) ✓
- [x] 01-03: API 보호 미들웨어 ✓

### Phase 2: Code Quality
**Goal**: 중복 코드 제거, 타입 안전성 강화, 일관된 코드 스타일
**Depends on**: Phase 1
**Research**: Unlikely (internal refactoring, established patterns)
**Plans**: TBD

Plans:
- [x] 02-01: 중복 유틸리티 함수 통합 (formatBytes, formatUptime) ✓
- [x] 02-02: Zod 런타임 타입 검증 추가 ✓
- [x] 02-03: 설정 상수 중앙화 (폴링 간격) ✓

### Phase 3: Testing Infrastructure
**Goal**: 테스트 프레임워크 구축 및 핵심 기능 테스트 커버리지 확보
**Depends on**: Phase 2
**Research**: Likely (test framework setup for Next.js 16)
**Research topics**: Jest vs Vitest for Next.js 16, React Testing Library, API route testing
**Plans**: 3 plans

Plans:
- [x] 03-01: Vitest 테스트 환경 설정 ✓
- [x] 03-02: 유틸리티 함수 단위 테스트 (utils.ts, system.ts) ✓
- [x] 03-03: API 엔드포인트 통합 테스트 (system, auth/session) ✓

### Phase 4: UI/UX Enhancement
**Goal**: 모던하고 직관적인 사용자 인터페이스 구현
**Depends on**: Phase 3
**Research**: Unlikely (internal UI patterns, Tailwind CSS)
**Plans**: TBD

Plans:
- [x] 04-01: 디자인 시스템 정립 (색상, 타이포그래피, 컴포넌트) ✓
- [x] 04-02: 대시보드 레이아웃 개선 ✓
- [x] 04-03: 인터랙션 및 애니메이션 추가 ✓

### Phase 5: Monitoring Upgrade
**Goal**: 상세 메트릭 수집 및 히스토리 시각화
**Depends on**: Phase 4
**Research**: Unlikely (extending existing monitoring patterns)
**Plans**: 3 plans

Plans:
- [x] 05-01: 메트릭 수집 강화 (네트워크, 프로세스) ✓
- [x] 05-02: 히스토리 저장 및 조회 기능 ✓
- [x] 05-03: 차트/그래프 시각화 ✓

### Phase 6: Performance Optimization
**Goal**: 폴링 주기 최적화, 캐싱 전략, 리소스 사용 효율화
**Depends on**: Phase 5
**Research**: Likely (caching strategies, polling optimization)
**Research topics**: React Query caching, SWR patterns, WebSocket vs polling
**Plans**: TBD

Plans:
- [x] 06-01: React Query 데이터 페칭 최적화 ✓
- [x] 06-02: 번들 사이즈 최적화 (Dynamic Import) ✓
- [x] 06-03: 렌더링 성능 최적화 (React.memo) ✓

### Phase 7: Alert System
**Goal**: 실시간 알림 및 경고 시스템 구현
**Depends on**: Phase 6
**Research**: Likely (notification architecture)
**Research topics**: Push notifications, WebSocket, toast libraries
**Plans**: TBD

Plans:
- [x] 07-01: 알림 인프라 구축 (타입, Zustand 스토어, 알림 엔진) ✓
- [x] 07-02: 알림 규칙 설정 UI (규칙 목록, 추가/수정/삭제) ✓
- [x] 07-03: 알림 전송 채널 구현 (Toast, 브라우저 알림) ✓

### Phase 8: Project Gallery
**Goal**: 프로젝트 작업물 전시 기능 추가
**Depends on**: Phase 7
**Research**: Unlikely (standard CRUD patterns)
**Plans**: TBD

Plans:
- [x] 08-01: 갤러리 데이터 모델 및 API ✓
- [x] 08-02: 갤러리 UI 컴포넌트 ✓
- [x] 08-03: 이미지/미디어 최적화 ✓

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Foundation | 3/3 | Complete | 2026-01-14 |
| 2. Code Quality | 3/3 | Complete | 2026-01-14 |
| 3. Testing Infrastructure | 3/3 | Complete | 2026-01-14 |
| 4. UI/UX Enhancement | 3/3 | Complete | 2026-01-14 |
| 5. Monitoring Upgrade | 3/3 | Complete | 2026-01-14 |
| 6. Performance Optimization | 3/3 | Complete | 2026-01-14 |
| 7. Alert System | 3/3 | Complete | 2026-01-14 |
| 8. Project Gallery | 3/3 | Complete | 2026-01-14 |
