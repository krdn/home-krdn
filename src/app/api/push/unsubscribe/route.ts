/**
 * Push Unsubscribe API
 * POST /api/push/unsubscribe - 푸시 알림 구독 해제
 *
 * Phase 23: Web Push 기반 푸시 알림
 * 인증된 사용자만 구독 해제할 수 있습니다.
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
 * POST /api/push/unsubscribe
 * 푸시 구독 해제
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    // 해당 사용자의 구독만 삭제
    const result = await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    })

    console.log('[Push] Unsubscribed:', { userId, deleted: result.count })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
