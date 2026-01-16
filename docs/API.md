# Home-KRDN API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://home.krdn.kr/api
```

## Authentication

대부분의 API는 JWT 기반 인증이 필요합니다. 로그인 후 `auth-token` 쿠키가 자동으로 설정됩니다.

- 인증 토큰: httpOnly 쿠키 (`auth-token`)
- 토큰 만료: 15분
- 권한 레벨: `admin` > `user` > `viewer`

## Response Format

모든 API는 일관된 JSON 형식으로 응답합니다:

```json
// 성공
{
  "success": true,
  "data": { ... }
}

// 실패
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

---

## Auth API

### POST /api/auth/login

사용자 로그인

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Errors:**
- `400`: 필수 필드 누락
- `401`: 잘못된 인증 정보

---

### POST /api/auth/register

새 사용자 등록

**Request Body:**
```json
{
  "username": "string (3-50자)",
  "email": "string (email format)",
  "password": "string (8자 이상)"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "newuser",
    "role": "viewer"
  }
}
```

**Errors:**
- `400`: 유효성 검증 실패
- `409`: 이미 존재하는 사용자명/이메일

---

### POST /api/auth/logout

로그아웃 (쿠키 제거)

**Response (200):**
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

---

### GET /api/auth/session

현재 세션 정보 조회

**Response (200):**
```json
{
  "success": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Errors:**
- `401`: 인증되지 않음

---

### POST /api/auth/forgot-password

비밀번호 재설정 이메일 발송

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "재설정 링크가 발송되었습니다"
}
```

---

### POST /api/auth/reset-password

비밀번호 재설정

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다"
}
```

---

## System API

### GET /api/system

시스템 메트릭 조회

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 25.5,
      "cores": 8,
      "model": "Intel Core i7",
      "loadAvg": ["1.20", "1.50", "1.30"]
    },
    "memory": {
      "total": "16 GB",
      "used": "8 GB",
      "free": "8 GB",
      "usage": 50
    },
    "disk": {
      "total": "500 GB",
      "used": "200 GB",
      "free": "300 GB",
      "usage": 40,
      "path": "/"
    },
    "network": [...],
    "processes": [...],
    "uptime": "5일 3시간",
    "hostname": "server",
    "platform": "linux"
  }
}
```

---

### GET /api/system/history

메트릭 히스토리 조회

**Query Parameters:**
- `minutes`: 조회할 기간 (기본: 30)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-01-15T10:00:00Z",
      "cpu": 25.5,
      "memory": 50,
      "disk": 40
    }
  ]
}
```

---

## Docker API

### GET /api/docker/containers

컨테이너 목록 조회

**Response (200):**
```json
{
  "success": true,
  "data": {
    "containers": [
      {
        "id": "abc123",
        "name": "nginx",
        "image": "nginx:latest",
        "state": "running",
        "status": "Up 2 hours",
        "created": "2026-01-15T08:00:00Z",
        "ports": ["80:80", "443:443"]
      }
    ],
    "summary": {
      "total": 10,
      "running": 8,
      "stopped": 2
    }
  }
}
```

---

### POST /api/docker/containers/[id]

컨테이너 액션 수행

**Auth Required:** `user` 이상

**URL Parameter:**
- `id`: 컨테이너 이름

**Request Body:**
```json
{
  "action": "start" | "stop" | "restart"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Container started successfully"
}
```

---

### GET /api/docker/containers/[id]

컨테이너 로그 조회

**URL Parameter:**
- `id`: 컨테이너 이름

**Query Parameters:**
- `tail`: 조회할 로그 라인 수 (기본: 100)
- `since`: 특정 시간 이후 로그만 조회

**Response (200):**
```json
{
  "success": true,
  "logs": "container log output..."
}
```

---

## Projects API

### GET /api/projects

프로젝트 목록 조회 (Public)

**Query Parameters:**
- `category`: `web` | `automation` | `ai` | `infra` | `other` | `all`
- `status`: `active` | `completed` | `archived` | `planned` | `all`
- `featured`: `true` | `false`

**Response (200):**
```json
{
  "success": true,
  "projects": [...],
  "total": 11,
  "categories": ["web", "automation", "ai"],
  "filters": {
    "category": "all",
    "status": "all"
  }
}
```

---

### POST /api/projects

프로젝트 생성

**Auth Required:** `user` 이상

**Request Body:**
```json
{
  "title": "프로젝트 이름",
  "slug": "project-slug",
  "description": "설명",
  "category": "web",
  "status": "active",
  "techStack": ["Next.js", "TypeScript"],
  "featured": false
}
```

**Response (201):**
```json
{
  "success": true,
  "project": { ... }
}
```

---

### GET /api/projects/[id]

프로젝트 상세 조회

**Response (200):**
```json
{
  "success": true,
  "project": { ... }
}
```

---

### PUT /api/projects/[id]

프로젝트 수정

**Auth Required:** `user` 이상

---

### DELETE /api/projects/[id]

프로젝트 삭제

**Auth Required:** `admin`

---

## Teams API

### GET /api/teams

사용자의 팀 목록 조회

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "team-uuid",
      "name": "Development Team",
      "description": "개발 팀",
      "memberCount": 5,
      "role": "owner"
    }
  ]
}
```

---

### POST /api/teams

새 팀 생성

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "팀 이름 (2-50자)",
  "description": "팀 설명 (선택)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "team-uuid",
    "name": "팀 이름",
    "ownerId": "user-uuid"
  }
}
```

---

### GET /api/teams/[teamId]/members

팀 멤버 목록 조회

**Auth Required:** 팀 멤버

---

### POST /api/teams/[teamId]/invites

팀 초대 생성

**Auth Required:** `owner` | `admin`

**Request Body:**
```json
{
  "email": "invite@example.com",
  "role": "member" | "admin"
}
```

---

### POST /api/invites/[token]

초대 수락

**Auth Required:** Yes

---

## Notifications API

### POST /api/notifications/email

이메일 알림 발송

**Auth Required:** `admin`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "제목",
  "type": "alert" | "report",
  "data": { ... }
}
```

---

### POST /api/notifications/slack

Slack 알림 발송

**Auth Required:** `admin`

**Request Body:**
```json
{
  "message": "알림 메시지",
  "severity": "info" | "warning" | "critical"
}
```

---

## Push API

### POST /api/push/subscribe

푸시 알림 구독

**Auth Required:** Yes

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

---

### POST /api/push/unsubscribe

푸시 알림 구독 해제

**Auth Required:** Yes

---

## Settings API

### GET /api/settings

사용자 설정 조회

**Auth Required:** Yes

---

### PUT /api/settings

사용자 설정 수정

**Auth Required:** Yes

**Request Body:**
```json
{
  "theme": "dark" | "light" | "system",
  "notifications": {
    "email": true,
    "push": true,
    "slack": false
  },
  "dashboard": {
    "widgets": ["metrics", "containers", "alerts"]
  }
}
```

---

## Admin API

### PUT /api/admin/users/[id]/role

사용자 역할 변경

**Auth Required:** `admin`

**Request Body:**
```json
{
  "role": "admin" | "user" | "viewer"
}
```

---

## WebSocket API

### WS /api/ws

실시간 데이터 스트리밍

**Message Types:**

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "metrics" | "containers" | "alerts"
}
```

**Unsubscribe:**
```json
{
  "type": "unsubscribe",
  "channel": "metrics"
}
```

**Server Events:**
```json
{
  "type": "metrics",
  "data": { ... }
}
```

---

## Port Registry API (v2.2)

### GET /api/ports

포트 레지스트리 목록 조회

**Auth Required:** `admin`

**Query Parameters:**
- `protocol`: `tcp` | `udp` | `all` (기본: all)
- `project`: 프로젝트명으로 필터

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "port": 3000,
      "protocol": "tcp",
      "service": "home-krdn",
      "project": "web",
      "description": "메인 대시보드",
      "url": "http://localhost:3000",
      "createdAt": "2026-01-16T00:00:00Z"
    }
  ]
}
```

---

### POST /api/ports

포트 등록

**Auth Required:** `admin`

**Request Body:**
```json
{
  "port": 3000,
  "protocol": "tcp",
  "service": "서비스명",
  "project": "프로젝트명",
  "description": "설명 (선택)",
  "url": "서비스 URL (선택)"
}
```

**Errors:**
- `409`: 포트 충돌 (이미 등록된 포트)

---

### PUT /api/ports/[id]

포트 정보 수정

**Auth Required:** `admin`

---

### DELETE /api/ports/[id]

포트 삭제

**Auth Required:** `admin`

---

## GitHub API (v2.2)

### GET /api/github/settings

GitHub 설정 조회

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "username": "github-user"
  }
}
```

---

### POST /api/github/settings

GitHub PAT 저장 (암호화)

**Auth Required:** `admin`

**Request Body:**
```json
{
  "token": "ghp_xxxxx"
}
```

---

### GET /api/github/repos

레포지토리 목록 조회

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "home-krdn",
      "fullName": "krdn/home-krdn",
      "private": false,
      "url": "https://github.com/krdn/home-krdn",
      "defaultBranch": "main",
      "updatedAt": "2026-01-16T00:00:00Z"
    }
  ]
}
```

---

### GET /api/github/repos/[owner]/[repo]/workflows

워크플로우 목록 조회

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "CI/CD",
      "path": ".github/workflows/ci.yml",
      "state": "active"
    }
  ]
}
```

---

### GET /api/github/repos/[owner]/[repo]/workflows/[workflowId]/runs

워크플로우 실행 이력 조회

**Auth Required:** `admin`

**Query Parameters:**
- `per_page`: 결과 수 (기본: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "status": "completed",
      "conclusion": "success",
      "event": "push",
      "branch": "main",
      "commit": "abc1234",
      "createdAt": "2026-01-16T00:00:00Z",
      "url": "https://github.com/..."
    }
  ]
}
```

---

## Log API (v2.2)

### GET /api/logs

로그 조회

**Auth Required:** `admin`

**Query Parameters:**
- `source`: `docker` | `file` | `all`
- `level`: `error` | `warn` | `info` | `debug`
- `search`: 검색어
- `from`: 시작 시간 (ISO 8601)
- `to`: 종료 시간 (ISO 8601)
- `limit`: 결과 수 (기본: 100)
- `offset`: 오프셋

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "timestamp": "2026-01-16T10:00:00Z",
      "source": "docker",
      "container": "nginx",
      "level": "info",
      "message": "로그 메시지"
    }
  ],
  "total": 1000
}
```

---

### GET /api/logs/stats

로그 통계 조회

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 10000,
    "byLevel": {
      "error": 50,
      "warn": 200,
      "info": 8000,
      "debug": 1750
    },
    "bySource": {
      "docker": 6000,
      "file": 4000
    }
  }
}
```

---

### WS /api/ws (logs 채널)

실시간 로그 스트리밍

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "logs",
  "filter": {
    "source": "docker",
    "container": "nginx"
  }
}
```

---

## Log Alerts API (v2.2)

### GET /api/log-alerts

로그 알림 규칙 목록

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Error Alert",
      "pattern": "error|exception",
      "isRegex": true,
      "level": "error",
      "source": "all",
      "channels": ["toast", "email"],
      "enabled": true,
      "cooldown": 300
    }
  ]
}
```

---

### POST /api/log-alerts

로그 알림 규칙 생성

**Auth Required:** `admin`

**Request Body:**
```json
{
  "name": "규칙 이름",
  "pattern": "검색 패턴",
  "isRegex": false,
  "level": "error",
  "source": "docker",
  "container": "nginx",
  "channels": ["toast", "slack"],
  "cooldown": 300
}
```

---

### PUT /api/log-alerts/[id]

로그 알림 규칙 수정

**Auth Required:** `admin`

---

### DELETE /api/log-alerts/[id]

로그 알림 규칙 삭제

**Auth Required:** `admin`

---

## Kubernetes API (v2.2)

### GET /api/kubernetes/clusters

클러스터 목록 조회

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "production",
      "server": "https://k8s.example.com:6443",
      "connected": true
    }
  ]
}
```

---

### POST /api/kubernetes/clusters

클러스터 등록

**Auth Required:** `admin`

**Request Body:**
```json
{
  "name": "클러스터명",
  "server": "https://k8s.example.com:6443",
  "token": "service-account-token",
  "caCert": "base64-encoded-ca-cert (선택)"
}
```

---

### GET /api/kubernetes/clusters/[id]/namespaces

네임스페이스 목록

**Auth Required:** `admin`

---

### GET /api/kubernetes/clusters/[id]/pods

Pod 목록

**Auth Required:** `admin`

**Query Parameters:**
- `namespace`: 네임스페이스 (기본: default)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "nginx-abc123",
      "namespace": "default",
      "status": "Running",
      "ready": "1/1",
      "restarts": 0,
      "age": "2d",
      "nodeName": "node-1"
    }
  ]
}
```

---

### GET /api/kubernetes/clusters/[id]/services

Service 목록

**Auth Required:** `admin`

**Query Parameters:**
- `namespace`: 네임스페이스 (기본: default)

---

### GET /api/kubernetes/clusters/[id]/deployments

Deployment 목록

**Auth Required:** `admin`

**Query Parameters:**
- `namespace`: 네임스페이스 (기본: default)

---

### GET /api/kubernetes/clusters/[id]/topology

서비스 토폴로지 조회

**Auth Required:** `admin`

**Query Parameters:**
- `namespace`: 네임스페이스 (기본: default)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "svc-nginx",
        "type": "service",
        "data": { "name": "nginx", "type": "ClusterIP" }
      },
      {
        "id": "deploy-nginx",
        "type": "deployment",
        "data": { "name": "nginx", "replicas": 3 }
      }
    ],
    "edges": [
      { "source": "svc-nginx", "target": "deploy-nginx" }
    ]
  }
}
```

---

## DevOps Summary API (v2.2)

### GET /api/devops/summary

DevOps 전체 상태 요약

**Auth Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "github": {
      "connected": true,
      "recentRuns": 5,
      "failedRuns": 1
    },
    "kubernetes": {
      "clusters": 2,
      "totalPods": 45,
      "runningPods": 42
    },
    "ports": {
      "total": 15,
      "byProtocol": { "tcp": 12, "udp": 3 }
    },
    "logAlerts": {
      "total": 5,
      "triggered24h": 12
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | 인증 필요 |
| `INVALID_CREDENTIALS` | 잘못된 인증 정보 |
| `FORBIDDEN` | 권한 부족 |
| `NOT_FOUND` | 리소스 없음 |
| `VALIDATION_ERROR` | 입력 유효성 오류 |
| `CONFLICT` | 리소스 충돌 |
| `RATE_LIMIT` | 요청 제한 초과 |
| `INTERNAL_ERROR` | 서버 내부 오류 |
| `GITHUB_API_ERROR` | GitHub API 오류 (v2.2) |
| `K8S_CONNECTION_ERROR` | Kubernetes 연결 오류 (v2.2) |

---

*Last updated: 2026-01-16 (v2.2 DevOps Tools)*
