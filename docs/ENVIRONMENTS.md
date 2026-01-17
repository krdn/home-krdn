# 환경별 설정 가이드

Home-KRDN 프로젝트의 개발/운영 환경 설정 방법입니다.

## 환경 구조

```
┌─────────────────────────────────────────────────────────────┐
│                         환경 구조                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   개발 (Development)          운영 (Production)              │
│   ├── .env                    ├── .env                      │
│   ├── .env.development        ├── .env.production           │
│   └── .env.development.local  └── .env.production.local     │
│       (민감한 정보)                (민감한 정보)               │
│                                                             │
│   docker-compose.dev.yml      docker-compose.yml            │
│   Dockerfile.dev              Dockerfile                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 빠른 시작

### 개발 환경

```bash
# 1. 환경 변수 설정
cp .env.example .env.development.local

# 2. .env.development.local 수정
#    - JWT_SECRET 설정
#    - VAPID 키 생성 (선택)

# 3-A. 로컬 개발 (권장)
npm install
npm run dev

# 3-B. Docker 개발
docker compose -f docker-compose.dev.yml up -d
```

### 운영 환경

```bash
# 1. 환경 변수 설정
cp .env.example .env.production.local

# 2. .env.production.local 수정 (필수!)
#    - JWT_SECRET: 새로 생성 (32자 이상)
#    - VAPID 키: 새로 생성
#    - 외부 서비스 API 키

# 3. 데이터 디렉토리 생성
mkdir -p data

# 4. Docker 배포
docker compose up -d --build
```

## 환경 변수 파일

### 우선순위 (Next.js)

```
높음  .env.local
  ↓   .env.[환경].local
  ↓   .env.[환경]
낮음  .env
```

### 파일별 역할

| 파일 | Git 추적 | 용도 |
|------|---------|------|
| `.env` | ✅ | 공통 설정 (민감하지 않은) |
| `.env.development` | ✅ | 개발 환경 기본값 |
| `.env.production` | ✅ | 운영 환경 기본값 |
| `.env.development.local` | ❌ | 개발 환경 민감 정보 |
| `.env.production.local` | ❌ | 운영 환경 민감 정보 |
| `.env.local` | ❌ | 로컬 오버라이드 |

### 필수 환경 변수

```bash
# 개발 환경 (.env.development.local)
JWT_SECRET=dev-secret-key-change-this
DATABASE_URL="file:./prisma/dev.db"

# 운영 환경 (.env.production.local)
JWT_SECRET=<32자 이상 랜덤 문자열>
DATABASE_URL="file:./data/production.db"
```

### 시크릿 키 생성

```bash
# JWT Secret (운영용)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin 비밀번호 해시
node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"

# VAPID 키
node scripts/generate-vapid-keys.js
```

## Docker 환경

### 개발 환경 (docker-compose.dev.yml)

```yaml
특징:
  - Hot Reload 지원 (소스 볼륨 마운트)
  - 디버깅 포트 노출 (9229)
  - 넓은 리소스 (512MB, 1 CPU)
  - 개발용 DB (./prisma/dev.db)

사용법:
  docker compose -f docker-compose.dev.yml up -d
  docker compose -f docker-compose.dev.yml logs -f
  docker compose -f docker-compose.dev.yml down
```

### 운영 환경 (docker-compose.yml)

```yaml
특징:
  - Multi-stage 빌드 (최적화)
  - 리소스 제한 (256MB, 0.5 CPU)
  - Nginx 리버스 프록시
  - 운영용 DB (./data/production.db)

사용법:
  docker compose up -d --build
  docker compose logs -f
  docker compose down
```

### 데이터 영속화

```
./data/                    # 운영 데이터 (gitignore)
  └── production.db        # SQLite 데이터베이스

./prisma/                  # 개발 데이터
  └── dev.db               # 개발용 DB
```

## 환경별 차이점

| 항목 | 개발 | 운영 |
|------|------|------|
| NODE_ENV | development | production |
| LOG_LEVEL | debug | info |
| DB 경로 | ./prisma/dev.db | ./data/production.db |
| 빌드 | npm run dev | npm run build |
| Hot Reload | ✅ | ❌ |
| 디버거 | ✅ (9229) | ❌ |
| 메모리 | 512MB | 256MB |
| Nginx | ❌ | ✅ |

## 문제 해결

### 개발 환경에서 Docker 파일 변경 감지 안 됨

```bash
# docker-compose.dev.yml에 이미 설정됨
environment:
  - WATCHPACK_POLLING=true
```

### 운영 환경 DB 마이그레이션

```bash
# 컨테이너 내부에서 실행
docker compose exec home-krdn npx prisma migrate deploy

# 또는 로컬에서 운영 DB 직접 마이그레이션
DATABASE_URL="file:./data/production.db" npx prisma migrate deploy
```

### 환경 변수 확인

```bash
# 개발
npm run dev
# → NODE_ENV=development 자동 적용

# 운영 빌드
npm run build
# → NODE_ENV=production 자동 적용

# Docker 내부 확인
docker compose exec home-krdn printenv | grep NODE_ENV
```

---
*Last updated: 2026-01-17*
