'use client';

/**
 * WorkflowStatusBadge 컴포넌트
 *
 * GitHub Actions 워크플로우 실행 상태를 시각적으로 표시하는 배지
 * 상태별 색상과 아이콘을 제공합니다.
 *
 * Phase 35: CI/CD Dashboard
 */

import {
  Check,
  X,
  Loader2,
  Clock,
  Ban,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GitHubWorkflowRun } from '@/types/github';

// ============================================================
// 타입 정의
// ============================================================

type WorkflowStatus = GitHubWorkflowRun['status'];
type WorkflowConclusion = GitHubWorkflowRun['conclusion'];

interface WorkflowStatusBadgeProps {
  /** 워크플로우 상태 (queued, in_progress, completed, waiting) */
  status: WorkflowStatus;
  /** 워크플로우 결론 (success, failure, cancelled, skipped, null) */
  conclusion: WorkflowConclusion;
  /** 배지 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// 상태별 설정
// ============================================================

interface StatusConfig {
  /** 배경 색상 클래스 */
  bgClass: string;
  /** 텍스트 색상 클래스 */
  textClass: string;
  /** 아이콘 컴포넌트 */
  Icon: typeof Check;
  /** 아이콘 애니메이션 클래스 */
  iconClass?: string;
  /** 접근성 라벨 */
  label: string;
}

/**
 * 상태 + 결론 조합에 따른 설정 반환
 */
function getStatusConfig(
  status: WorkflowStatus,
  conclusion: WorkflowConclusion
): StatusConfig {
  // 진행 중
  if (status === 'in_progress') {
    return {
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-300',
      Icon: Loader2,
      iconClass: 'animate-spin',
      label: '진행 중',
    };
  }

  // 대기 중 (queued, waiting)
  if (status === 'queued' || status === 'waiting') {
    return {
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      textClass: 'text-yellow-700 dark:text-yellow-300',
      Icon: Clock,
      label: status === 'queued' ? '대기열' : '대기 중',
    };
  }

  // 완료됨 - 결론에 따라 분기
  if (status === 'completed') {
    switch (conclusion) {
      case 'success':
        return {
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          textClass: 'text-green-700 dark:text-green-300',
          Icon: Check,
          label: '성공',
        };
      case 'failure':
        return {
          bgClass: 'bg-red-100 dark:bg-red-900/30',
          textClass: 'text-red-700 dark:text-red-300',
          Icon: X,
          label: '실패',
        };
      case 'cancelled':
        return {
          bgClass: 'bg-gray-100 dark:bg-gray-800',
          textClass: 'text-gray-600 dark:text-gray-400',
          Icon: Ban,
          label: '취소됨',
        };
      case 'skipped':
        return {
          bgClass: 'bg-gray-100 dark:bg-gray-800',
          textClass: 'text-gray-600 dark:text-gray-400',
          Icon: SkipForward,
          label: '건너뜀',
        };
      default:
        // conclusion이 null인 경우 (드물게 발생)
        return {
          bgClass: 'bg-gray-100 dark:bg-gray-800',
          textClass: 'text-gray-600 dark:text-gray-400',
          Icon: Clock,
          label: '완료',
        };
    }
  }

  // 기본값 (알 수 없는 상태)
  return {
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-600 dark:text-gray-400',
    Icon: Clock,
    label: '알 수 없음',
  };
}

// ============================================================
// 사이즈별 스타일
// ============================================================

const sizeStyles = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 워크플로우 상태 배지
 *
 * @example
 * ```tsx
 * <WorkflowStatusBadge status="completed" conclusion="success" />
 * <WorkflowStatusBadge status="in_progress" conclusion={null} size="lg" />
 * ```
 */
export function WorkflowStatusBadge({
  status,
  conclusion,
  size = 'md',
  className,
}: WorkflowStatusBadgeProps) {
  const config = getStatusConfig(status, conclusion);
  const styles = sizeStyles[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgClass,
        config.textClass,
        styles.badge,
        className
      )}
      role="status"
      aria-label={`워크플로우 상태: ${config.label}`}
    >
      <config.Icon className={cn(styles.icon, config.iconClass)} />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * 상태 아이콘만 표시하는 컴포넌트
 *
 * @example
 * ```tsx
 * <WorkflowStatusIcon status="completed" conclusion="success" />
 * ```
 */
export function WorkflowStatusIcon({
  status,
  conclusion,
  size = 'md',
  className,
}: Omit<WorkflowStatusBadgeProps, 'className'> & { className?: string }) {
  const config = getStatusConfig(status, conclusion);
  const styles = sizeStyles[size];

  return (
    <span
      className={cn('inline-flex items-center', config.textClass, className)}
      role="status"
      aria-label={`워크플로우 상태: ${config.label}`}
    >
      <config.Icon className={cn(styles.icon, config.iconClass)} />
    </span>
  );
}
