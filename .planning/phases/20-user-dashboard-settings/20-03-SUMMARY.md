# Phase 20-03 Summary: 대시보드 위젯 커스터마이징 구현

## 완료 일시
2026-01-15

## 목표
사용자가 대시보드 위젯의 가시성과 순서를 개인화할 수 있는 기능 제공

## 완료된 작업

### Task 1: 위젯 레이아웃 타입 및 대시보드 스토어 구현
- `src/types/dashboard.ts` 생성:
  - `WidgetId` 타입 정의 (system-stats, metrics-charts, containers, services, overview, quick-links)
  - `WidgetConfig` 인터페이스 (id, visible, order)
  - `DashboardLayout` 인터페이스 (widgets 배열)
  - `WIDGET_META` 상수 (UI 표시용 위젯 메타데이터)
  - `DEFAULT_DASHBOARD_LAYOUT` 상수 (기본 레이아웃)

- `src/stores/dashboardStore.ts` 생성:
  - Zustand 스토어 (persist 미사용 - 서버 동기화)
  - 상태: layout, isLoading, isInitialized
  - 액션: setLayout, toggleWidget, moveWidget, resetToDefault, setLoading, setInitialized
  - 셀렉터: getVisibleWidgets, getWidgetConfig
  - 유틸리티: serializeDashboardLayout, parseDashboardLayout (JSON 변환)

- 커밋: `7e7bb1c`

### Task 2: WidgetCustomizer UI 및 대시보드 동적 렌더링 구현 (checkpoint)
- `src/components/admin/WidgetCustomizer.tsx` 생성:
  - 드롭다운 패널 형태의 커스터마이저 UI
  - 위젯 체크박스 토글 (가시성 on/off)
  - 위젯 순서 변경 버튼 (up/down)
  - Reset to Default 버튼
  - debounce 300ms 후 서버 자동 저장
  - 패널 외부 클릭 시 자동 닫힘

- `src/components/admin/AdminDashboard.tsx` 생성:
  - useSettings 훅으로 서버 설정 로드
  - useDashboardStore로 위젯 레이아웃 관리
  - 동적 위젯 렌더링 (getVisibleWidgets 결과 기반)
  - Containers + Services 연속 시 2열 그리드 유지
  - RunningServicesCard, QuickLinksSection 컴포넌트 분리

- `src/app/admin/page.tsx` 수정:
  - AdminDashboard 클라이언트 컴포넌트 사용
  - 서버 컴포넌트에서 클라이언트 컴포넌트 래퍼로 전환

- 커밋: `d8f6c13`

## 생성/수정된 파일

### 신규 생성
- `src/types/dashboard.ts` - 위젯 타입 정의 (104 lines)
- `src/stores/dashboardStore.ts` - 대시보드 스토어 (153 lines)
- `src/components/admin/WidgetCustomizer.tsx` - 위젯 커스터마이저 UI (211 lines)
- `src/components/admin/AdminDashboard.tsx` - 대시보드 클라이언트 컴포넌트 (320 lines)

### 수정됨
- `src/app/admin/page.tsx` - AdminDashboard 컴포넌트 사용으로 간소화 (13 lines)

## 기술 구현 세부사항

### 대시보드 스토어 구조
```typescript
interface DashboardState {
  layout: DashboardLayout;
  isLoading: boolean;
  isInitialized: boolean;
  setLayout: (layout: DashboardLayout) => void;
  toggleWidget: (id: WidgetId) => void;
  moveWidget: (id: WidgetId, direction: 'up' | 'down') => void;
  resetToDefault: () => void;
  getVisibleWidgets: () => WidgetConfig[];
}
```

### 서버 동기화 흐름
1. 페이지 로드 시 useSettings로 서버 설정 fetch
2. dashboardLayout JSON 파싱하여 스토어 초기화
3. 위젯 변경 시 debounce 300ms 후 서버 저장
4. 새로고침 시 서버 설정 유지

### 위젯 동적 렌더링 로직
```typescript
const WIDGET_COMPONENTS: Record<WidgetId, () => ReactNode> = {
  'system-stats': () => <DashboardStats />,
  'metrics-charts': () => <LazyMetricsCharts />,
  'containers': () => <ContainerStats />,
  'services': () => <RunningServicesCard />,
  'overview': () => <AdminOverview />,
  'quick-links': () => <QuickLinksSection />,
};

// Containers + Services 연속 시 2열 그리드 유지
function renderWidgets(visibleWidgetIds: WidgetId[]): ReactNode[]
```

## 검증 결과
- [x] `npm run build` 성공
- [x] 타입 검사 통과
- [x] WidgetCustomizer UI 구현
- [x] 위젯 토글 시 대시보드 반영
- [x] 위젯 순서 변경 시 대시보드 반영
- [x] 설정 서버 동기화 구조 구현

## Phase 20 완료

Phase 20 User Dashboard Settings가 완료되었습니다:
- 20-01: 사용자 설정 API 및 DB 스키마
- 20-02: 사용자 설정 UI 페이지 및 테마 서버 동기화
- 20-03: 대시보드 위젯 커스터마이징

## 다음 단계 제안
- 드래그 앤 드롭으로 위젯 순서 변경 (react-beautiful-dnd 등)
- 위젯 크기 조절 기능
- 대시보드 레이아웃 프리셋 (Compact, Full 등)
