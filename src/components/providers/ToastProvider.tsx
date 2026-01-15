'use client';

import * as Toast from '@radix-ui/react-toast';
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import type { AlertSeverity } from '@/types/alert';
import { AlertToast } from '@/components/admin/AlertToast';

// Toast 데이터 타입
interface ToastData {
  id: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  duration?: number;
}

// Toast Context 타입
interface ToastContextValue {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast 표시 훅
 * ToastProvider 내부에서만 사용 가능합니다.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider 컴포넌트
 * Radix Toast를 사용한 알림 시스템을 제공합니다.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Toast 추가
  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  // Toast 제거
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <AlertToast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
        <Toast.Viewport
          className="fixed bottom-0 right-0 flex flex-col gap-2 p-4 w-96 max-w-full z-50"
          aria-label="알림"
        />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
