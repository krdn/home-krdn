# Phase 20-02 Summary: 사용자 설정 UI 페이지 및 테마 서버 동기화 구현

## 완료 일시
2026-01-15

## 목표
사용자가 테마, 알림 설정을 변경하고 서버에 저장할 수 있는 인터페이스 제공

## 완료된 작업

### Task 1: useSettings 훅 및 /admin/settings 페이지 구현
- `useSettings` 훅 구현:
  - React Query `useQuery`로 GET /api/settings fetch
  - `useMutation`으로 PUT /api/settings 업데이트
  - staleTime: 5분, 설정 변경 시 캐시 업데이트
  - 반환: `{ settings, isLoading, error, updateSettings, isUpdating, updateError, refetch }`
- `/admin/settings` 페이지 구현:
  - 테마 설정 카드: Dark/Light 선택 버튼 UI
  - 알림 설정 카드: 이메일 알림, 푸시 알림 토글 스위치
  - 실시간 저장 방식 (변경 시 즉시 서버 동기화)
  - 로딩/에러/미인증 상태 처리
  - Card + CardHeader + CardContent 구조 적용
- 커밋: `a440198`

### Task 2: 테마 토글 서버 동기화 연동
- ThemeToggle.tsx 수정:
  - `useAuth` 훅으로 로그인 상태 확인
  - `useSettings` 훅으로 서버 설정 가져오기
  - 초기 로드 시: 로그인 상태면 서버 설정의 theme 적용
  - 테마 변경 시: 로컬 즉시 적용 + 로그인 상태면 서버 동기화
  - 비로그인 시: 기존 localStorage 기반 동작 유지
  - 서버 동기화 실패해도 로컬 동작 유지 (best-effort)
- 커밋: `ea11cc9`

## 생성/수정된 파일

### 신규 생성
- `src/hooks/useSettings.ts` - 사용자 설정 관리 훅 (145 lines)
- `src/app/admin/settings/page.tsx` - 설정 페이지 (235 lines)

### 수정됨
- `src/components/ui/ThemeToggle.tsx` - 서버 동기화 기능 추가 (+68 lines)

## 기술 구현 세부사항

### useSettings 훅
```typescript
interface UseSettingsReturn {
  settings: UserSettingsDto | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (data: UpdateSettingsInput) => void;
  isUpdating: boolean;
  updateError: Error | null;
  refetch: () => void;
}
```

### 설정 페이지 UI 구성
- Header: Settings 아이콘 + 제목 + 설명
- 테마 설정 카드: Moon/Sun 아이콘 버튼으로 Dark/Light 선택
- 알림 설정 카드: ToggleSwitch 컴포넌트로 이메일/푸시 알림 토글
- 업데이트 중 상태 표시: 우하단 플로팅 인디케이터

### ThemeToggle 서버 동기화 로직
1. 인증 로딩 완료 대기
2. 로그인 상태면 서버 설정 로딩 대기
3. 서버 설정 또는 localStorage 기반으로 초기 테마 적용
4. 테마 변경 시 로컬 즉시 적용 후 서버 동기화 (로그인 시)

## 검증 결과
- [x] `npm run build` 성공
- [x] /admin/settings 페이지 접근 가능
- [x] 테마 변경이 서버에 저장됨 (로그인 시)
- [x] 알림 설정 변경이 서버에 저장됨

## 다음 단계
- 20-03: 대시보드 레이아웃 설정 (dashboardLayout) 구현 예정
- 설정과 실제 알림 시스템 통합 (푸시 알림 권한 요청 등)
