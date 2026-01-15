# home-krdn Wiki

> v2.1 기준 (2026-01-15 업데이트)

홈서버의 모든 서비스, 컨테이너, 시스템 리소스를 **한눈에 파악하고 관리**하는 통합 모니터링 대시보드입니다.

## 목차

1. [[프로젝트-개요]]
2. [[기술-스택]]
3. [[디렉토리-구조]]
4. [[페이지-설계]]
5. [[서비스-목록]]
6. [[배포-가이드]]
7. [[개발-과정]]

## 빠른 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev

# 테스트 실행
npm run test

# 프로덕션 빌드
npm run build

# Docker 배포
docker-compose up -d
```

## 주요 기능

### 모니터링
- 시스템 메트릭 실시간 모니터링 (CPU, 메모리, 디스크)
- 네트워크/프로세스 상세 메트릭
- Recharts 기반 시계열 차트 시각화
- 메트릭 히스토리 저장

### Docker 관리
- 컨테이너 목록 조회 (가상화 지원)
- 컨테이너 시작/중지/재시작
- 실시간 로그 조회
- 컨테이너 상태 Push 알림

### 실시간 통신
- WebSocket 기반 실시간 데이터 스트리밍
- 폴링 대신 Push 방식 메트릭 업데이트
- 자동 재연결 + heartbeat 전략

### 알림 시스템
- Zustand 기반 알림 스토어
- 임계값 기반 알림 규칙 엔진
- 다중 채널 지원:
  - Toast 알림
  - 이메일 (Resend API)
  - Slack 웹훅 (Block Kit)
  - Push Notification (Web Push)

### 멀티 유저
- JWT 기반 인증 (로그인/회원가입)
- RBAC 권한 관리 (admin/user/viewer)
- 팀 기능 (생성/초대/프로젝트 공유)
- 사용자별 대시보드 커스터마이징

### PWA
- Service Worker 기반 오프라인 지원
- 앱 설치 프롬프트
- 오프라인 폴백 페이지

## 접속 정보

| 환경 | URL | 포트 |
|------|-----|------|
| 개발 | http://localhost:3000 | 3000 |
| 프로덕션 | https://home.krdn.kr | 443 |

## 문서

- [README](../../README.md) - 프로젝트 개요 및 Quick Start
- [API Documentation](../API.md) - REST API 문서

## 마일스톤 히스토리

| 버전 | 상태 | 주요 기능 |
|------|------|----------|
| v1.0 MVP | ✅ 완료 | 기본 모니터링, Docker 관리, 알림 |
| v1.1 Enhancement | ✅ 완료 | WebSocket, 이메일/Slack 알림, Admin CRUD |
| v2.0 Multi-User | ✅ 완료 | 인증, RBAC, 팀, PWA |
| v2.1 Polish | 🚧 진행중 | 테스트 확대, 접근성, 성능 최적화, 문서화 |

## 라이선스

MIT License
