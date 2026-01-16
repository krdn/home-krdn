# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-01-16

### Added
- **Port Registry**: 프로젝트별 포트 할당, 충돌 감지, 서비스 URL 관리 (`/admin/ports`)
- **GitHub Integration**: Octokit SDK 통합, PAT 암호화 저장, 레포지토리/워크플로우 조회
- **CI/CD Dashboard**: GitHub Actions 상태 배지, 실행 이력 시각화 (`/admin/github`)
- **Log Aggregation**: Docker 컨테이너 로그 스트리밍, 파일 로그 수집 (node-tail)
- **Log Viewer UI**: WebSocket 실시간 스트리밍, 검색/필터링, 가상화 (`/admin/logs`)
- **Log Alerts**: 로그 패턴 기반 알림 규칙 엔진 (`/admin/log-alerts`)
- **Kubernetes Discovery**: @kubernetes/client-node 통합, 프로그래매틱 kubeconfig 생성
- **K8s Dashboard**: Pod/Service/Deployment 조회, 네임스페이스 필터 (`/admin/kubernetes`)
- **Service Mesh Overview**: React Flow 기반 서비스 토폴로지 시각화
- **DevOps Home**: 통합 DevOps 상태 요약 대시보드 (`/admin/devops`)

### Dependencies
- `@kubernetes/client-node` ^1.1.0
- `@octokit/rest` ^22.0.0
- `@xyflow/react` ^12.3.6
- `yaml` ^2.7.0

## [2.1.0] - 2026-01-15

### Added
- 단위/통합 테스트 커버리지 확대 (103개 → 318개 테스트)
- E2E 테스트 활성화 (Playwright, 67개 테스트, 다중 브라우저)
- 커스텀 에러 클래스 7종 (`AppError`, `AuthError`, `ValidationError` 등)
- 17개 타입-세이프 에러 코드
- ARIA 속성 50+ 추가, 포커스 트랩 훅
- 스킵 링크 컴포넌트, `prefers-reduced-motion` 지원
- pino 기반 구조화된 로깅 시스템

### Changed
- 에러 핸들링 표준화 (중앙집중식 핸들러)
- 성능 최적화 (memo, useMemo, useCallback)
- 조건부 가상화 (20+ 항목 시 자동 적용)
- Dynamic Import 적용 (폼 컴포넌트)

### Documentation
- README.md 전면 개편 (36줄 → 157줄)
- docs/API.md 신규 생성 (30개 엔드포인트)
- Wiki 문서 v2.1 업데이트

## [2.0.0] - 2026-01-15

### Added
- **Database Infrastructure**: Prisma + SQLite 기반 DB (User, Team, TeamMember, UserSettings)
- **Auth System Extension**: 회원가입, 비밀번호 재설정, 역할 관리
- **RBAC Access Control**: 권한 매트릭스, 미들웨어, 라우트 보호
- **User Dashboard Settings**: 개인 위젯 설정, 테마 서버 동기화
- **Team Features**: 팀 생성/초대, 프로젝트 공유, 팀 알림 채널
- **PWA Foundation**: 매니페스트, 서비스워커, 설치 프롬프트
- **Push Notification**: Web Push API, VAPID 인증, 구독 관리
- **Offline Caching**: 네이티브 SW 캐싱 전략, 오프라인 폴백 페이지

### Changed
- 인증 시스템 DB 전환 (환경변수 → SQLite)
- 역할 기반 UI 조건부 렌더링

## [1.1.0] - 2026-01-15

### Added
- **WebSocket Infrastructure**: 양방향 실시간 통신 (ws, next-ws)
- **Real-time Metrics**: 폴링 → WebSocket Push 전환
- **Real-time Containers**: 컨테이너 상태 실시간 Push
- **Email Notification**: Resend API 기반 이메일 알림
- **Slack Integration**: Block Kit 포맷 Slack 알림
- **Project Admin CRUD**: JSON 기반 프로젝트 관리
- **Admin Dashboard**: 통합 관리 UI (`/admin/*`)
- **E2E Testing**: Playwright 테스트 인프라

## [1.0.0] - 2026-01-15

### Added
- **Security Foundation**: JWT 인증 시스템 (jose)
- **Code Quality**: 타입 안전성 강화, 중복 제거
- **Testing Infrastructure**: Vitest 단위 테스트 환경
- **UI/UX Enhancement**: 디자인 시스템, Framer Motion 애니메이션
- **Monitoring Upgrade**: Recharts 기반 시계열 차트 시각화
- **Performance Optimization**: TanStack Query 캐싱, 번들 최적화
- **Alert System**: 임계값 기반 알림 규칙 엔진
- **Project Gallery**: 작업물 전시, 이미지 최적화

### Core Features
- 시스템 메트릭 실시간 모니터링 (CPU, 메모리, 디스크, 네트워크)
- Docker 컨테이너 관리 (목록, 시작/중지/재시작, 로그)
- 서비스 카탈로그 페이지
- 반응형 랜딩 페이지

---

[2.2.0]: https://github.com/krdn/home-krdn/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/krdn/home-krdn/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/krdn/home-krdn/compare/v1.1...v2.0.0
[1.1.0]: https://github.com/krdn/home-krdn/compare/v1.0.0...v1.1
[1.0.0]: https://github.com/krdn/home-krdn/releases/tag/v1.0.0
