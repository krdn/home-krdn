/**
 * Push Notification Service
 * Web Push API를 사용한 푸시 알림 전송 서비스
 *
 * Phase 23: Web Push 기반 푸시 알림
 */

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// VAPID 설정
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@krdn.dev',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

/**
 * 푸시 알림 페이로드
 */
export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

/**
 * 푸시 전송 결과
 */
export interface PushResult {
  success: number
  failed: number
}

/**
 * 단일 사용자에게 푸시 전송
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<PushResult> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  let success = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
      success++
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode
      // 410 Gone: 구독이 만료됨 - 삭제
      if (statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
        console.log('[Push] Deleted expired subscription:', sub.id)
      }
      failed++
    }
  }

  if (success > 0 || failed > 0) {
    console.log('[Push] Sent to user:', { userId, success, failed })
  }

  return { success, failed }
}

/**
 * 여러 사용자에게 푸시 전송
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<PushResult> {
  const results = await Promise.all(
    userIds.map((userId) => sendPushToUser(userId, payload))
  )

  return results.reduce(
    (acc, r) => ({
      success: acc.success + r.success,
      failed: acc.failed + r.failed,
    }),
    { success: 0, failed: 0 }
  )
}

/**
 * 모든 구독자에게 브로드캐스트
 */
export async function broadcastPush(payload: PushPayload): Promise<PushResult> {
  const subscriptions = await prisma.pushSubscription.findMany()

  let success = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
      success++
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode
      if (statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
      failed++
    }
  }

  console.log('[Push] Broadcast:', { success, failed })

  return { success, failed }
}

/**
 * 알림 타입별 푸시 페이로드 생성 헬퍼
 */
export function createAlertPayload(
  level: 'info' | 'warning' | 'critical',
  message: string,
  url?: string
): PushPayload {
  const titles = {
    info: '📢 알림',
    warning: '⚠️ 경고',
    critical: '🚨 긴급',
  }

  return {
    title: titles[level],
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: url || '/admin/alerts',
    tag: `alert-${level}`,
  }
}
