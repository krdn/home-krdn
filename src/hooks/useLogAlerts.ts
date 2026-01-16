/**
 * useLogAlerts Hook
 * 로그 알림 규칙 관리 훅
 *
 * Phase 38: Log-based Alerts
 * - TanStack Query 기반 데이터 페칭
 * - 규칙 CRUD 뮤테이션
 * - 실시간 알림 이벤트 수신
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useRef } from 'react'
import type { LogAlertRule, NewLogAlertRule, UpdateLogAlertRule, LogAlertEvent } from '@/types/log-alert'

// ============================================================
// API 호출 함수
// ============================================================

interface LogAlertRulesResponse {
  success: boolean
  data: {
    global: LogAlertRule[]
    user: LogAlertRule[]
  }
}

interface LogAlertRuleResponse {
  success: boolean
  data: LogAlertRule
}

/**
 * 규칙 목록 조회
 */
async function fetchLogAlertRules(): Promise<LogAlertRulesResponse> {
  const response = await fetch('/api/log-alerts', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch log alert rules')
  }

  return response.json()
}

/**
 * 규칙 생성
 */
async function createLogAlertRule(
  data: NewLogAlertRule & { global?: boolean }
): Promise<LogAlertRuleResponse> {
  const response = await fetch('/api/log-alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create log alert rule')
  }

  return response.json()
}

/**
 * 규칙 수정
 */
async function updateLogAlertRule(
  id: string,
  data: UpdateLogAlertRule
): Promise<LogAlertRuleResponse> {
  const response = await fetch(`/api/log-alerts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update log alert rule')
  }

  return response.json()
}

/**
 * 규칙 삭제
 */
async function deleteLogAlertRule(id: string): Promise<void> {
  const response = await fetch(`/api/log-alerts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete log alert rule')
  }
}

/**
 * 규칙 토글
 */
async function toggleLogAlertRule(id: string): Promise<LogAlertRuleResponse> {
  const response = await fetch(`/api/log-alerts/${id}/toggle`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to toggle log alert rule')
  }

  return response.json()
}

// ============================================================
// Query Keys
// ============================================================

export const logAlertKeys = {
  all: ['log-alerts'] as const,
  lists: () => [...logAlertKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...logAlertKeys.lists(), filters] as const,
  details: () => [...logAlertKeys.all, 'detail'] as const,
  detail: (id: string) => [...logAlertKeys.details(), id] as const,
}

// ============================================================
// 훅: 규칙 목록 조회
// ============================================================

export interface UseLogAlertRulesOptions {
  enabled?: boolean
}

export function useLogAlertRules(options: UseLogAlertRulesOptions = {}) {
  return useQuery({
    queryKey: logAlertKeys.lists(),
    queryFn: fetchLogAlertRules,
    enabled: options.enabled ?? true,
    staleTime: 30 * 1000, // 30초
    select: (data) => ({
      global: data.data.global,
      user: data.data.user,
      all: [...data.data.global, ...data.data.user],
    }),
  })
}

// ============================================================
// 훅: 규칙 생성
// ============================================================

export function useCreateLogAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLogAlertRule,
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: logAlertKeys.lists() })
    },
  })
}

// ============================================================
// 훅: 규칙 수정
// ============================================================

export function useUpdateLogAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLogAlertRule }) =>
      updateLogAlertRule(id, data),
    onSuccess: (_, variables) => {
      // 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: logAlertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: logAlertKeys.detail(variables.id) })
    },
  })
}

// ============================================================
// 훅: 규칙 삭제
// ============================================================

export function useDeleteLogAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLogAlertRule,
    onSuccess: (_, id) => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: logAlertKeys.lists() })
      // 상세 캐시 제거
      queryClient.removeQueries({ queryKey: logAlertKeys.detail(id) })
    },
  })
}

// ============================================================
// 훅: 규칙 토글
// ============================================================

export function useToggleLogAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleLogAlertRule,
    onSuccess: (response) => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: logAlertKeys.lists() })
      // 상세 캐시 업데이트
      queryClient.setQueryData(logAlertKeys.detail(response.data.id), response)
    },
  })
}

// ============================================================
// 훅: 실시간 알림 스트림 (WebSocket)
// ============================================================

export interface UseLogAlertStreamOptions {
  onAlert?: (event: LogAlertEvent) => void
  enabled?: boolean
}

export function useLogAlertStream(options: UseLogAlertStreamOptions = {}) {
  const { onAlert, enabled = true } = options
  const wsRef = useRef<WebSocket | null>(null)
  const callbackRef = useRef(onAlert)

  // 콜백 레퍼런스 업데이트
  useEffect(() => {
    callbackRef.current = onAlert
  }, [onAlert])

  // WebSocket 연결 및 구독
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[useLogAlertStream] WebSocket connected')
      // 로그 알림 채널 구독
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'log-alerts' }))
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'log:alert' && callbackRef.current) {
          callbackRef.current(message.data as LogAlertEvent)
        }
      } catch (error) {
        console.error('[useLogAlertStream] Failed to parse message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[useLogAlertStream] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[useLogAlertStream] WebSocket closed')
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', channel: 'log-alerts' }))
        ws.close()
      }
    }
  }, [enabled])

  // 수동 연결 해제
  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }
  }, [])

  return { disconnect }
}
