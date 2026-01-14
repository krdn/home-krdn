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
- [ ] **Phase 2: Code Quality** - 중복 제거, 타입 안전성 강화, 코드 정리
- [ ] **Phase 3: Testing Infrastructure** - 테스트 프레임워크 설정 및 핵심 기능 테스트
- [ ] **Phase 4: UI/UX Enhancement** - 모던하고 직관적인 인터페이스 개선
- [ ] **Phase 5: Monitoring Upgrade** - 상세 메트릭, 히스토리, 시각화 강화
- [ ] **Phase 6: Performance Optimization** - 폴링 개선, 캐싱, 리소스 최적화
- [ ] **Phase 7: Alert System** - 실시간 알림/경고 시스템 구현
- [ ] **Phase 8: Project Gallery** - 작업물 전시 기능 추가

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
- [ ] 02-01: 중복 유틸리티 함수 통합 (formatBytes, formatUptime)
- [ ] 02-02: 타입 정의 강화 및 any 타입 제거
- [ ] 02-03: 환경 설정 정리 (.env.example, 매직 넘버)

### Phase 3: Testing Infrastructure
**Goal**: 테스트 프레임워크 구축 및 핵심 기능 테스트 커버리지 확보
**Depends on**: Phase 2
**Research**: Likely (test framework setup for Next.js 16)
**Research topics**: Jest vs Vitest for Next.js 16, React Testing Library, API route testing
**Plans**: TBD

Plans:
- [ ] 03-01: 테스트 환경 설정 (Vitest/Jest)
- [ ] 03-02: 유틸리티 및 서비스 레이어 테스트
- [ ] 03-03: API 엔드포인트 통합 테스트

### Phase 4: UI/UX Enhancement
**Goal**: 모던하고 직관적인 사용자 인터페이스 구현
**Depends on**: Phase 3
**Research**: Unlikely (internal UI patterns, Tailwind CSS)
**Plans**: TBD

Plans:
- [ ] 04-01: 디자인 시스템 정립 (색상, 타이포그래피, 컴포넌트)
- [ ] 04-02: 대시보드 레이아웃 개선
- [ ] 04-03: 인터랙션 및 애니메이션 추가

### Phase 5: Monitoring Upgrade
**Goal**: 상세 메트릭 수집 및 히스토리 시각화
**Depends on**: Phase 4
**Research**: Unlikely (extending existing monitoring patterns)
**Plans**: TBD

Plans:
- [ ] 05-01: 메트릭 수집 강화 (네트워크, 프로세스)
- [ ] 05-02: 히스토리 저장 및 조회 기능
- [ ] 05-03: 차트/그래프 시각화

### Phase 6: Performance Optimization
**Goal**: 폴링 주기 최적화, 캐싱 전략, 리소스 사용 효율화
**Depends on**: Phase 5
**Research**: Likely (caching strategies, polling optimization)
**Research topics**: React Query caching, SWR patterns, WebSocket vs polling
**Plans**: TBD

Plans:
- [ ] 06-01: 데이터 페칭 최적화 (캐싱, 중복 요청 제거)
- [ ] 06-02: 번들 사이즈 최적화
- [ ] 06-03: 렌더링 성능 개선

### Phase 7: Alert System
**Goal**: 실시간 알림 및 경고 시스템 구현
**Depends on**: Phase 6
**Research**: Likely (notification architecture)
**Research topics**: Push notifications, WebSocket, toast libraries
**Plans**: TBD

Plans:
- [ ] 07-01: 알림 인프라 구축 (이벤트 시스템)
- [ ] 07-02: 알림 규칙 설정 UI
- [ ] 07-03: 알림 전송 채널 구현 (브라우저, 이메일 등)

### Phase 8: Project Gallery
**Goal**: 프로젝트 작업물 전시 기능 추가
**Depends on**: Phase 7
**Research**: Unlikely (standard CRUD patterns)
**Plans**: TBD

Plans:
- [ ] 08-01: 갤러리 데이터 모델 및 API
- [ ] 08-02: 갤러리 UI 컴포넌트
- [ ] 08-03: 이미지/미디어 최적화

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Foundation | 3/3 | Complete | 2026-01-14 |
| 2. Code Quality | 0/3 | Not started | - |
| 3. Testing Infrastructure | 0/3 | Not started | - |
| 4. UI/UX Enhancement | 0/3 | Not started | - |
| 5. Monitoring Upgrade | 0/3 | Not started | - |
| 6. Performance Optimization | 0/3 | Not started | - |
| 7. Alert System | 0/3 | Not started | - |
| 8. Project Gallery | 0/3 | Not started | - |
