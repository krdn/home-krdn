# 38-02 Summary: REST API + 훅

## Execution Status

| Task | Status | Notes |
|------|--------|-------|
| Task 1: /api/log-alerts GET/POST | ✅ Done | 목록 조회 + 생성 |
| Task 2: /api/log-alerts/[id] GET/PUT/DELETE | ✅ Done | 개별 CRUD |
| Task 3: /api/log-alerts/[id]/toggle POST | ✅ Done | 활성화/비활성화 토글 |
| Task 4: useLogAlerts 훅 | ✅ Done | TanStack Query 기반 |

## Created Files

| File | Purpose |
|------|---------|
| `src/app/api/log-alerts/route.ts` | 규칙 목록 조회/생성 API |
| `src/app/api/log-alerts/[id]/route.ts` | 개별 규칙 CRUD API |
| `src/app/api/log-alerts/[id]/toggle/route.ts` | 규칙 토글 API |
| `src/hooks/useLogAlerts.ts` | TanStack Query 훅들 |

## Key Implementation Details

### API 엔드포인트

```
GET    /api/log-alerts           - 규칙 목록 (global + user)
POST   /api/log-alerts           - 규칙 생성

GET    /api/log-alerts/[id]      - 규칙 상세 조회
PUT    /api/log-alerts/[id]      - 규칙 수정
DELETE /api/log-alerts/[id]      - 규칙 삭제

POST   /api/log-alerts/[id]/toggle - 활성화/비활성화 토글
```

### 권한 체계

| 역할 | 전역 규칙 | 본인 규칙 | 타인 규칙 |
|------|-----------|-----------|-----------|
| User | 조회만 | CRUD | 조회 불가 |
| Admin | CRUD | CRUD | CRUD |

### React Query 훅

```typescript
// 규칙 목록 조회
useLogAlertRules({ enabled: boolean })

// CRUD 뮤테이션
useCreateLogAlertRule()
useUpdateLogAlertRule()
useDeleteLogAlertRule()
useToggleLogAlertRule()

// 실시간 알림 스트림 (WebSocket)
useLogAlertStream({ onAlert, enabled })
```

### 인증 패턴

```typescript
// 기존 프로젝트 패턴 따름
async function getAuthPayload(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const result = await verifyToken(token)
  return result.valid ? result.payload : null
}

// JWTPayload.userId 사용 (sub 아님)
```

## Verification Checklist

- [x] TypeScript 타입 체크 통과
- [x] npm run build 성공
- [x] API 엔드포인트 라우트 등록 확인
- [x] 권한 체크 로직 검증

## Duration

~5min

## Next Steps

38-03: Admin UI
- LogAlertRuleForm 컴포넌트
- LogAlertRuleCard 컴포넌트
- LogAlertRuleList 컴포넌트
- /admin/log-alerts 페이지
