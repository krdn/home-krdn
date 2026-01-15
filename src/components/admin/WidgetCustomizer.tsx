'use client';

/**
 * WidgetCustomizer 컴포넌트
 *
 * Phase 20: User Dashboard Settings
 *
 * 대시보드 위젯의 가시성과 순서를 사용자가 커스터마이징할 수 있는 UI입니다.
 * 드롭다운 패널 형태로 표시되며, 변경사항은 자동으로 서버에 저장됩니다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDashboardStore, serializeDashboardLayout } from '@/stores/dashboardStore';
import { WIDGET_META, type WidgetId } from '@/types/dashboard';
import { useSettings } from '@/hooks/useSettings';

// debounce 함수
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

interface WidgetCustomizerProps {
  className?: string;
}

export function WidgetCustomizer({ className }: WidgetCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { layout, toggleWidget, moveWidget, resetToDefault } =
    useDashboardStore();
  const { updateSettings } = useSettings();

  // 서버 저장 (debounce 300ms)
  const saveToServer = useCallback(
    (layoutJson: string) => {
      setIsSaving(true);
      updateSettings({ dashboardLayout: layoutJson });
      // 짧은 시간 후 저장 상태 해제
      setTimeout(() => setIsSaving(false), 500);
    },
    [updateSettings]
  );

  const debouncedSave = useDebounce(saveToServer, 300);

  // 레이아웃 변경 시 서버에 저장
  useEffect(() => {
    // 초기화 전에는 저장하지 않음
    const { isInitialized } = useDashboardStore.getState();
    if (!isInitialized) return;

    const layoutJson = serializeDashboardLayout(layout);
    debouncedSave(layoutJson);
  }, [layout, debouncedSave]);

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // 위젯을 order 순으로 정렬
  const sortedWidgets = [...layout.widgets].sort((a, b) => a.order - b.order);

  // 토글 핸들러
  const handleToggle = (id: WidgetId) => {
    toggleWidget(id);
  };

  // 이동 핸들러
  const handleMove = (id: WidgetId, direction: 'up' | 'down') => {
    moveWidget(id, direction);
  };

  // 리셋 핸들러
  const handleReset = () => {
    resetToDefault();
  };

  return (
    <div className={`relative ${className || ''}`} ref={panelRef}>
      {/* Customize 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        <span>Customize</span>
        {isSaving && (
          <span className="text-xs text-muted-foreground">(Saving...)</span>
        )}
      </Button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Dashboard Widgets</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 위젯 목록 */}
          <div className="space-y-2">
            {sortedWidgets.map((widget, index) => {
              const meta = WIDGET_META[widget.id];
              const isFirst = index === 0;
              const isLast = index === sortedWidgets.length - 1;

              return (
                <div
                  key={widget.id}
                  className="flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted/50"
                >
                  {/* 체크박스 + 이름 */}
                  <label className="flex flex-1 cursor-pointer items-center gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={widget.visible}
                      onClick={() => handleToggle(widget.id)}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        widget.visible
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground bg-background'
                      }`}
                    >
                      {widget.visible && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={`text-sm ${
                        widget.visible ? '' : 'text-muted-foreground'
                      }`}
                    >
                      {meta.name}
                    </span>
                  </label>

                  {/* 순서 변경 버튼 */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(widget.id, 'up')}
                      disabled={isFirst}
                      className={`rounded p-1 transition-colors ${
                        isFirst
                          ? 'cursor-not-allowed text-muted-foreground/50'
                          : 'hover:bg-muted'
                      }`}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMove(widget.id, 'down')}
                      disabled={isLast}
                      className={`rounded p-1 transition-colors ${
                        isLast
                          ? 'cursor-not-allowed text-muted-foreground/50'
                          : 'hover:bg-muted'
                      }`}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset 버튼 */}
          <div className="mt-4 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
