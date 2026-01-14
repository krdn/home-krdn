/**
 * 이메일 알림 API Route
 * Resend API를 통해 알림 이메일을 발송합니다.
 * - Zod 스키마 검증
 * - 규칙별 쿨다운 적용
 * - 일일 발송 제한
 */

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { EMAIL_CONFIG } from '@/config/constants';

// Resend 클라이언트 (API 키 없으면 null)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// 요청 스키마
const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  ruleId: z.string().optional(),
});

// 이메일 쿨다운 추적 (인메모리)
const emailCooldowns = new Map<string, number>();

// 일일 발송 카운트 추적
let dailyEmailCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * 일일 카운트 리셋 체크
 * 날짜가 바뀌면 카운트를 리셋합니다.
 */
function checkDailyReset(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyEmailCount = 0;
    lastResetDate = today;
  }
}

/**
 * 쿨다운 체크
 * @param ruleId 규칙 ID
 * @param cooldownMinutes 쿨다운 시간 (분)
 * @returns 쿨다운 중이면 true
 */
function isInCooldown(ruleId: string, cooldownMinutes: number): boolean {
  const lastSent = emailCooldowns.get(ruleId);
  if (!lastSent) return false;
  return Date.now() - lastSent < cooldownMinutes * 60 * 1000;
}

/**
 * POST /api/notifications/email
 * 이메일 발송 요청을 처리합니다.
 */
export async function POST(request: Request) {
  try {
    // API 키 체크
    if (!resend) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY not configured' },
        { status: 503 }
      );
    }

    // 일일 제한 체크
    checkDailyReset();
    if (dailyEmailCount >= EMAIL_CONFIG.MAX_DAILY_EMAILS) {
      return NextResponse.json(
        { success: false, error: 'Daily email limit reached' },
        { status: 429 }
      );
    }

    // 요청 파싱 및 검증
    const body = await request.json();
    const result = SendEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 400 }
      );
    }

    const { to, subject, html, ruleId } = result.data;

    // ruleId가 있으면 쿨다운 체크
    if (ruleId && isInCooldown(ruleId, EMAIL_CONFIG.DEFAULT_COOLDOWN_MINUTES)) {
      return NextResponse.json(
        { success: false, error: 'Email cooldown active for this rule' },
        { status: 429 }
      );
    }

    // 이메일 발송
    const response = await resend.emails.send({
      from: process.env.ALERT_EMAIL_FROM || 'alerts@resend.dev',
      to,
      subject: `${EMAIL_CONFIG.SUBJECT_PREFIX} ${subject}`,
      html,
    });

    // 성공 시 쿨다운 및 카운트 업데이트
    if (ruleId) {
      emailCooldowns.set(ruleId, Date.now());
    }
    dailyEmailCount++;

    return NextResponse.json({
      success: true,
      messageId: response.data?.id,
    });
  } catch (error) {
    console.error('[Email API] Send failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
