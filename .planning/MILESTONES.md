# Project Milestones: Home-KRDN

## v2.4 Help System (Shipped: 2026-01-19)

**Delivered:** 모든 페이지와 위젯에 상세한 한국어 도움말 시스템 제공

**Phases completed:** 44-46 (6 plans total)

**Key accomplishments:**
- HelpButton + HelpModal 컴포넌트 구현 (ghost style, Framer Motion 애니메이션)
- 44개 도움말 콘텐츠 저장소 구조화 (페이지/위젯별 카테고리)
- 15개 페이지에 도움말 아이콘 배치 (Public 5개 + Admin 10개)
- 20개 위젯에 도움말 아이콘 배치 (Dashboard/Port 7개 + Admin/DevOps/Team 13개)
- HelpContext 전역 상태 관리 (ESC/backdrop 닫기, focus trap, ARIA)
- 모든 도움말 한국어로 작성 (기능 설명 + 상태 의미 + 관련 설정 안내)

**Stats:**
- 62 files modified
- +4,611 lines of TypeScript added
- 3 phases, 6 plans, 37 requirements
- v2.3 → v2.4: same day release (~3 hours)

**Git range:** `feat(44-01)` → `docs(46)`

**What's next:** 다음 마일스톤 계획 대기

---

## v2.3 Port Scanner & Guide (Shipped: 2026-01-19)

**Delivered:** 시스템 실제 포트 현황 조회 및 신규 개발 포트 가이드 제공

**Phases completed:** 43 (2 plans total)

**Key accomplishments:**
- Docker API 기반 컨테이너 포트 바인딩 조회
- ss 명령어 기반 시스템 포트 스캔 (IPv4/IPv6 지원)
- 등록 포트 vs 실제 활성 포트 비교 분석 (3분류)
- 카테고리별 포트 사용률 Progress Bar 시각화
- 신규 개발 포트 추천 가이드 UI (4탭 Admin 페이지)

**Stats:**
- 14 files modified
- ~1,678 lines of TypeScript added
- 1 phase, 2 plans
- v2.2 → v2.3: 3 days

**Git range:** `feat(43-01)` → `docs(43)`

**What's next:** 다음 마일스톤 계획 대기

---

## v2.2 DevOps Tools (Shipped: 2026-01-16)

**Delivered:** CI/CD 파이프라인 시각화, 로그 관리, Kubernetes 지원, 포트 레지스트리로 DevOps 통합 경험 제공

**Phases completed:** 33-42 (27 plans total)

**Key accomplishments:**
- Port Registry System (포트 할당 관리, 충돌 감지, 카테고리별 범위)
- GitHub CI/CD 연동 (Octokit SDK, 워크플로우 상태, 실행 이력)
- 로그 수집 백엔드 (Docker socket 스트리밍, 파일 로그, WebSocket)
- 로그 뷰어 UI (필터링, 검색, 실시간 스트리밍, 가상화)
- Kubernetes 연동 (@kubernetes/client-node, Pod/Service/Deployment)
- Service Mesh 시각화 (React Flow 기반 서비스 토폴로지)
- DevOps 통합 대시보드 (전체 도구 상태 요약 홈)

**Stats:**
- 264 TypeScript files
- ~54,000 lines of TypeScript
- 10 phases, 27 plans
- v2.1 → v2.2: 1 day

**Git range:** `feat(33-01)` → `feat(42-03)`

**What's next:** Port Scanner & Guide — 시스템 포트 현황 조회 + 신규 개발 포트 가이드

---

## v2.1 Polish (Shipped: 2026-01-15)

**Delivered:** 테스트 커버리지 확대, E2E 다중 브라우저, 에러 핸들링 표준화, 접근성 개선, 성능 최적화, 문서화 강화, Pino 로깅

**Phases completed:** 25-32 (16 plans total)

**Key accomplishments:**
- 테스트 커버리지 확대 (103개 → 378개)
- Playwright E2E 다중 브라우저 (Chromium, Firefox, Webkit)
- 중앙집중식 에러 핸들링 (7개 커스텀 에러 클래스)
- WCAG 접근성 컴플라이언스 (ARIA 50+, useFocusTrap)
- 성능 최적화 (메모이제이션, 가상화, Dynamic Import)
- README 4배 확장, API 문서 30개 엔드포인트
- Pino 기반 구조화된 로깅

**Stats:**
- 378 tests (275 added)
- 8 phases, 16 plans
- v2.0 → v2.1: same day release

**Git range:** `feat(25-01)` → `docs(32)`

**What's next:** 추가 기능 계획 대기

---

## v2.0 Multi-User Foundation (Shipped: 2026-01-15)

**Delivered:** Prisma DB 인프라, 멀티유저 인증/인가, 팀 협업, PWA 모바일 경험

**Phases completed:** 17-24 (17 plans total)

**Key accomplishments:**
- Prisma 7 + SQLite 데이터베이스 인프라
- 회원가입, 비밀번호 재설정, 역할 관리
- RBAC 권한 기반 접근 제어
- 팀 생성/초대, 멤버 관리, 팀 알림
- PWA 설치 프롬프트 및 매니페스트
- Web Push 알림 (VAPID)
- 오프라인 캐싱 및 폴백 페이지

**Stats:**
- 6 DB models (User, UserSettings, Team, TeamMember, TeamInvite, PushSubscription)
- 8 phases, 17 plans
- v1.1 → v2.0: same day release

**Git range:** `feat(17-01)` → `feat(24-01)`

**What's next:** v2.1 Polish — 테스트, 접근성, 문서화

---

## v1.1 Enhancement (Shipped: 2026-01-15)

**Delivered:** WebSocket 실시간 통신, 이메일/Slack 알림 채널, 프로젝트 관리 Admin 기능, E2E 테스트 인프라

**Phases completed:** 9-16 (9 plans total)

**Key accomplishments:**
- WebSocket 서버/클라이언트 인프라 (ws + next-ws, 재연결, heartbeat)
- 실시간 메트릭/컨테이너 스트리밍 (폴링 대체)
- 이메일 알림 채널 (Resend API, Critical 알림 전송)
- Slack 웹훅 통합 (Block Kit 메시지)
- 프로젝트 Admin CRUD (JSON 저장소, REST API, Admin UI)
- Admin Dashboard UI (통합 관리 인터페이스)
- Playwright E2E 테스트 환경 구축

**Stats:**
- 54 files created/modified
- 8,145 lines of TypeScript added
- 8 phases, 9 plans
- v1.0 → v1.1: 1 day (same day release)

**Git range:** `feat(09-01)` → `feat(16-01)`

**What's next:** v2.0 계획 (멀티 유저 지원, Kubernetes 옵션 등)

---

## v1.0 MVP (Shipped: 2026-01-15)

**Delivered:** JWT 인증, 테스트 인프라, UI 개선, 모니터링 강화, 알림 시스템, 프로젝트 갤러리

**Phases completed:** 1-8 (24 plans total)

**Key accomplishments:**
- JWT 인증 시스템 (jose, bcryptjs, API 미들웨어)
- Vitest 테스트 프레임워크 구축
- 디자인 시스템 + Framer Motion 애니메이션
- 히스토리 차트 시각화 (Recharts)
- CPU/메모리/디스크/컨테이너 알림 규칙
- 프로젝트 갤러리 + 이미지 최적화

**Stats:**
- 85 files created/modified
- 10,866 lines of TypeScript
- 8 phases, 24 plans
- 2 days from start to ship

**Git range:** `feat(01-01)` → `feat(08-01)`

**What's next:** v1.1 Enhancement — WebSocket, 외부 알림, Admin CRUD

---
