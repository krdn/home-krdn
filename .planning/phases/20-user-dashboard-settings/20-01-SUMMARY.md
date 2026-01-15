# Phase 20-01 Summary: UserSettings 백엔드 서비스 및 API 라우트 구현

## 완료 일시
2026-01-15

## 목표
사용자별 대시보드 설정(테마, 알림, 레이아웃)을 서버에 저장하고 관리하는 기반 구축

## 완료된 작업

### Task 1: UserSettings 서비스 함수 구현
- `getUserSettings(userId)`: 사용자 설정 조회, 없으면 기본값으로 생성 후 반환
- `updateUserSettings(userId, data)`: 설정 업데이트 (부분 업데이트 지원)
- `getOrCreateUserSettings(userId)`: 내부 헬퍼 - 없으면 기본값으로 생성
- `UpdateSettingsInputSchema`: Zod 검증 스키마 (theme, emailNotifications, pushNotifications, dashboardLayout)
- `UserSettingsDto`: 클라이언트 반환용 타입 정의
- 기본값: theme="dark", emailNotifications=true, pushNotifications=false
- 커밋: `b688f08`

### Task 2: UserSettings API 라우트 구현 (GET/PUT)
- `GET /api/settings`: 인증된 사용자의 설정 조회
- `PUT /api/settings`: 인증된 사용자의 설정 업데이트
- JWT 토큰 기반 인증 필수 (401 미인증 응답)
- Zod 검증 실패 시 400 에러 반환
- Node.js runtime 명시 (better-sqlite3 어댑터 호환)
- 커밋: `da09b7f`

## 생성된 파일

### 신규 생성
- `src/lib/settings-service.ts` - 사용자 설정 서비스 레이어 (150 lines)
- `src/app/api/settings/route.ts` - 설정 API 엔드포인트 (150 lines)

## 기술 구현 세부사항

### 서비스 레이어 패턴
- user-service.ts 패턴을 따름
- Prisma upsert를 사용한 설정 생성/조회 최적화
- DTO 변환으로 필요한 필드만 노출

### API 보안
- 쿠키에서 auth-token 추출
- jose jwtVerify로 토큰 검증
- userId를 페이로드에서 추출하여 자신의 설정만 접근 가능

### Zod 검증 스키마
```typescript
{
  theme: 'dark' | 'light' (optional)
  emailNotifications: boolean (optional)
  pushNotifications: boolean (optional)
  dashboardLayout: string (optional)
}
```

## 검증 결과
- [x] `npm run build` 성공
- [x] `npx tsc --noEmit` - 새 파일에 타입 오류 없음
- [x] `/api/settings` 라우트가 빌드에 포함됨
- [x] Zod 검증 스키마 적용됨
- [x] 인증 미들웨어 패턴 적용됨

## API 응답 형식

### GET /api/settings (성공)
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "dashboardLayout": null,
    "theme": "dark",
    "emailNotifications": true,
    "pushNotifications": false
  }
}
```

### PUT /api/settings (성공)
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "dashboardLayout": "{...}",
    "theme": "light",
    "emailNotifications": true,
    "pushNotifications": true
  }
}
```

## 다음 단계
- 20-02: 프론트엔드 설정 UI 컴포넌트 구현 (Settings 페이지)
- 20-03: 설정과 실제 테마/알림 시스템 통합
