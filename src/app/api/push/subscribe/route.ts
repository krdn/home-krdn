/**
 * Push Subscription API
 * POST /api/push/subscribe - 푸시 알림 구독 등록
 *
 * Phase 23: Web Push 기반 푸시 알림
 * 인증된 사용자만 구독할 수 있습니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

// better-sqlite3 어댑터 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'

// JWT 설정
const JWT_ALGORITHM = 'HS256'
const COOKIE_NAME = 'auth-token'

/**
 * JWT 시크릿 키를 가져옵니다.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다')
  }
  return new TextEncoder().encode(secret)
}

/**
 * JWT에서 사용자 ID를 추출합니다.
 */
async function getUserIdFromToken(
  request: NextRequest
): Promise<string | null> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
    })

    return (payload.userId as string) || null
  } catch {
    return null
  }
}

/**
 * POST /api/push/subscribe
 * 푸시 구독 등록 (upsert로 중복 방지)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await request.json()
    const { endpoint, keys } = subscription

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // upsert로 중복 구독 방지
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    console.log('[Push] Subscribed:', { userId, endpoint: endpoint.slice(0, 50) + '...' })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Push] Subscribe error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
