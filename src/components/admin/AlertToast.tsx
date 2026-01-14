'use client';

import * as Toast from '@radix-ui/react-toast';
import { AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertSeverity } from '@/types/alert';

interface AlertToastProps {
  id: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  duration?: number;
  onClose: () => void;
}

// 심각도별 스타일 설정
const severityConfig: Record<
  AlertSeverity,
  {
    icon: typeof Info;
    bg: string;
    border: string;
    text: string;
  }
> = {
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  critical: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
  },
};

/**
 * 알림 Toast 컴포넌트
 * 심각도에 따라 다른 스타일과 아이콘이 적용됩니다.
 */
export function AlertToast({
  title,
  description,
  severity,
  duration = 5000,
  onClose,
}: AlertToastProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Toast.Root
      className={cn(
        'rounded-lg border p-4 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
        'data-[state=closed]:slide-out-to-right-full',
        'data-[state=open]:slide-in-from-right-full',
        config.bg,
        config.border
      )}
      duration={duration}
      onOpenChange={(open) => !open && onClose()}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.text)} />
        <div className="flex-1 min-w-0">
          <Toast.Title className={cn('font-semibold', config.text)}>
            {title}
          </Toast.Title>
          {description && (
            <Toast.Description className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {description}
            </Toast.Description>
          )}
        </div>
        <Toast.Close className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
          <X className="h-4 w-4" />
        </Toast.Close>
      </div>
    </Toast.Root>
  );
}
