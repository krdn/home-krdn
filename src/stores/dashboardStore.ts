'use client';

/**
 * 대시보드 스토어
 *
 * Phase 20: User Dashboard Settings
 *
 * 사용자의 대시보드 위젯 레이아웃을 관리합니다.
 * 서버 동기화를 위해 persist 미들웨어를 사용하지 않습니다.
 */

import { create } from 'zustand';
import type {
  DashboardLayout,
  WidgetConfig,
  WidgetId,
} from '@/types/dashboard';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/types/dashboard';

interface DashboardState {
  // 상태
  layout: DashboardLayout;
  isLoading: boolean;
  isInitialized: boolean;

  // 액션
  /**
   * 레이아웃 설정
   * 서버에서 로드한 레이아웃 또는 기본 레이아웃을 설정합니다.
   */
  setLayout: (layout: DashboardLayout) => void;

  /**
   * 위젯 가시성 토글
   */
  toggleWidget: (id: WidgetId) => void;

  /**
   * 위젯 순서 변경
   * @param id 위젯 ID
   * @param direction 이동 방향 (up: 위로, down: 아래로)
   */
  moveWidget: (id: WidgetId, direction: 'up' | 'down') => void;

  /**
   * 기본 레이아웃으로 리셋
   */
  resetToDefault: () => void;

  /**
   * 로딩 상태 설정
   */
  setLoading: (isLoading: boolean) => void;

  /**
   * 초기화 완료 설정
   */
  setInitialized: (isInitialized: boolean) => void;

  // 셀렉터
  /**
   * 표시할 위젯 목록 반환 (order 순으로 정렬)
   */
  getVisibleWidgets: () => WidgetConfig[];

  /**
   * 위젯 설정 반환
   */
  getWidgetConfig: (id: WidgetId) => WidgetConfig | undefined;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  layout: DEFAULT_DASHBOARD_LAYOUT,
  isLoading: false,
  isInitialized: false,

  setLayout: (layout: DashboardLayout) =>
    set({ layout, isInitialized: true }),

  toggleWidget: (id: WidgetId) =>
    set((state) => ({
      layout: {
        widgets: state.layout.widgets.map((widget) =>
          widget.id === id ? { ...widget, visible: !widget.visible } : widget
        ),
      },
    })),

  moveWidget: (id: WidgetId, direction: 'up' | 'down') =>
    set((state) => {
      const widgets = [...state.layout.widgets].sort((a, b) => a.order - b.order);
      const currentIndex = widgets.findIndex((w) => w.id === id);

      if (currentIndex === -1) return state;

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      // 범위 체크
      if (targetIndex < 0 || targetIndex >= widgets.length) return state;

      // 순서 스왑
      const currentOrder = widgets[currentIndex].order;
      const targetOrder = widgets[targetIndex].order;

      const updatedWidgets = state.layout.widgets.map((widget) => {
        if (widget.id === id) {
          return { ...widget, order: targetOrder };
        }
        if (widget.id === widgets[targetIndex].id) {
          return { ...widget, order: currentOrder };
        }
        return widget;
      });

      return { layout: { widgets: updatedWidgets } };
    }),

  resetToDefault: () =>
    set({
      layout: {
        widgets: DEFAULT_DASHBOARD_LAYOUT.widgets.map((w) => ({ ...w })),
      },
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setInitialized: (isInitialized: boolean) => set({ isInitialized }),

  getVisibleWidgets: () => {
    const { layout } = get();
    return layout.widgets
      .filter((widget) => widget.visible)
      .sort((a, b) => a.order - b.order);
  },

  getWidgetConfig: (id: WidgetId) => {
    const { layout } = get();
    return layout.widgets.find((widget) => widget.id === id);
  },
}));

/**
 * DashboardLayout을 JSON 문자열로 변환
 * 서버 저장용
 */
export function serializeDashboardLayout(layout: DashboardLayout): string {
  return JSON.stringify(layout);
}

/**
 * JSON 문자열을 DashboardLayout으로 변환
 * 서버에서 로드 시 사용
 */
export function parseDashboardLayout(json: string | null): DashboardLayout {
  if (!json) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  try {
    const parsed = JSON.parse(json) as DashboardLayout;

    // 유효성 검사: widgets 배열이 있는지 확인
    if (!parsed.widgets || !Array.isArray(parsed.widgets)) {
      return DEFAULT_DASHBOARD_LAYOUT;
    }

    // 새로 추가된 위젯이 있을 수 있으므로 기본 레이아웃과 병합
    const existingIds = new Set(parsed.widgets.map((w) => w.id));
    const mergedWidgets = [...parsed.widgets];

    for (const defaultWidget of DEFAULT_DASHBOARD_LAYOUT.widgets) {
      if (!existingIds.has(defaultWidget.id)) {
        mergedWidgets.push({
          ...defaultWidget,
          order: mergedWidgets.length,
        });
      }
    }

    return { widgets: mergedWidgets };
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}
