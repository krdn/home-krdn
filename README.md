# Home-KRDN

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.2-blue)](CHANGELOG.md)

홈서버의 모든 서비스, 컨테이너, 시스템 리소스를 한눈에 파악하고 관리할 수 있는 **통합 모니터링 대시보드**입니다.

## Features

### Core Monitoring
- **시스템 메트릭**: CPU, 메모리, 디스크, 네트워크 실시간 모니터링
- **Docker 관리**: 컨테이너 목록 조회, 시작/중지/재시작, 로그 확인
- **메트릭 히스토리**: Recharts 기반 시계열 차트 시각화

### Real-time
- **WebSocket 스트리밍**: 폴링 대신 실시간 데이터 Push
- **다중 채널 알림**: Toast, 이메일(Resend), Slack, Push Notification
- **알림 규칙 엔진**: 임계값 기반 자동 알림

### Multi-User
- **JWT 인증**: 로그인/회원가입, 비밀번호 재설정
- **RBAC 권한 관리**: admin/user/viewer 역할 기반 접근 제어
- **팀 기능**: 팀 생성, 초대, 프로젝트 공유

### PWA
- **오프라인 지원**: Service Worker 기반 캐싱
- **Push Notification**: Web Push API 알림
- **설치 가능**: 앱처럼 홈 화면에 추가

### DevOps Tools (v2.2)
- **Port Registry**: 프로젝트별 포트 할당, 충돌 감지, 서비스 URL 관리
- **GitHub Integration**: Actions 워크플로우, 실행 이력, CI/CD 상태 대시보드
- **Log Aggregation**: Docker/파일 로그 수집, 실시간 스트리밍, 검색/필터링
- **Log Alerts**: 로그 패턴 기반 알림 규칙 엔진
- **Kubernetes Dashboard**: Pod/Service/Deployment 관리, 네임스페이스 필터
- **Service Mesh Overview**: React Flow 기반 서비스 토폴로지 시각화
- **DevOps Home**: 전체 DevOps 상태 요약 대시보드

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | Next.js 16.1, React 19.2 |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 4, Framer Motion |
| State | Zustand, TanStack Query |
| Testing | Vitest, Playwright |
| Real-time | ws, next-ws |
| Auth | jose (JWT), bcryptjs |
| Charts | Recharts |
| Validation | Zod |
| DevOps | @octokit/rest, @kubernetes/client-node |
| Visualization | @xyflow/react (React Flow) |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (컨테이너 관리 기능 사용 시)
- npm 또는 pnpm

### Installation

```bash
# 저장소 클론
git clone https://github.com/krdn/home-krdn.git
cd home-krdn

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

### Environment Variables

```env
# Auth (필수)
JWT_SECRET=your-secret-key-min-32-chars

# Docker (선택)
DOCKER_SOCKET=/var/run/docker.sock

# Notifications (선택)
RESEND_API_KEY=re_xxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Push Notifications (선택)
VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx

# GitHub Integration (선택) - Admin UI에서 설정 가능
# GITHUB_TOKEN=ghp_xxxxx

# Kubernetes (선택) - Admin UI에서 클러스터별 설정
# KUBECONFIG=~/.kube/config
```

### Scripts

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버
npm run test      # Vitest 단위 테스트
npm run test:e2e  # Playwright E2E 테스트
npm run lint      # ESLint 검사
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   │   ├── auth/       # 인증 API
│   │   ├── docker/     # Docker 관리 API
│   │   ├── ports/      # 포트 레지스트리 API (v2.2)
│   │   ├── github/     # GitHub 연동 API (v2.2)
│   │   ├── logs/       # 로그 수집 API (v2.2)
│   │   ├── kubernetes/ # Kubernetes API (v2.2)
│   │   └── devops/     # DevOps 요약 API (v2.2)
│   ├── admin/          # Admin 페이지
│   │   ├── ports/      # 포트 관리 (v2.2)
│   │   ├── github/     # CI/CD 대시보드 (v2.2)
│   │   ├── logs/       # 로그 뷰어 (v2.2)
│   │   ├── log-alerts/ # 로그 알림 규칙 (v2.2)
│   │   ├── kubernetes/ # K8s 대시보드 (v2.2)
│   │   └── devops/     # DevOps 홈 (v2.2)
│   ├── services/       # 서비스 카탈로그
│   └── teams/          # 팀 관리
├── components/         # React 컴포넌트
│   ├── ui/            # 기본 UI 컴포넌트
│   ├── admin/         # Admin 전용 컴포넌트
│   ├── devops/        # DevOps 컴포넌트 (v2.2)
│   └── landing/       # 랜딩 페이지 컴포넌트
├── hooks/              # Custom Hooks
├── lib/                # 유틸리티 & 서비스
│   ├── services/      # 비즈니스 로직
│   ├── errors.ts      # 에러 클래스
│   └── rbac.ts        # 권한 관리
├── stores/             # Zustand 스토어
└── types/              # TypeScript 타입
```

## Docker Deployment

```bash
# Docker Compose로 배포
docker-compose up -d

# 또는 직접 빌드
docker build -t home-krdn .
docker run -d -p 3005:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  home-krdn
```

## Documentation

- [API Documentation](docs/API.md)
- [Wiki](docs/wiki/Home.md)
  - [프로젝트 개요](docs/wiki/프로젝트-개요.md)
  - [기술 스택](docs/wiki/기술-스택.md)
  - [배포 가이드](docs/wiki/배포-가이드.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with Claude Code — v2.2 DevOps Tools (2026-01-16)*
