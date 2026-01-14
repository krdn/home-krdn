/**
 * Slack 웹훅 알림 API Route
 * Slack Incoming Webhook을 통해 Block Kit 메시지를 발송합니다.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SLACK_CONFIG } from '@/config/constants';

// 요청 스키마
const SendSlackSchema = z.object({
  webhookUrl: z.string().regex(
    SLACK_CONFIG.WEBHOOK_URL_PATTERN,
    'Invalid Slack webhook URL format'
  ),
  message: z.object({
    text: z.string().min(1),
    blocks: z.array(z.any()).optional(),
  }),
  ruleId: z.string().optional(),
});

// Slack 쿨다운 추적 (인메모리)
const slackCooldowns = new Map<string, number>();

// 일일 발송 카운트 추적
let dailySlackCount = 0;
let lastResetDate = new Date().toDateString();

// 일일 카운트 리셋 체크
function checkDailyReset(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySlackCount = 0;
    lastResetDate = today;
  }
}

// 쿨다운 체크
function isInCooldown(ruleId: string, cooldownMinutes: number): boolean {
  const lastSent = slackCooldowns.get(ruleId);
  if (!lastSent) return false;
  return Date.now() - lastSent < cooldownMinutes * 60 * 1000;
}

export async function POST(request: Request) {
  try {
    // 일일 제한 체크
    checkDailyReset();
    if (dailySlackCount >= SLACK_CONFIG.MAX_DAILY_MESSAGES) {
      return NextResponse.json(
        { success: false, error: 'Daily Slack message limit reached' },
        { status: 429 }
      );
    }

    // 요청 파싱 및 검증
    const body = await request.json();
    const result = SendSlackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 400 }
      );
    }

    const { webhookUrl, message, ruleId } = result.data;

    // ruleId가 있으면 쿨다운 체크
    if (ruleId && isInCooldown(ruleId, SLACK_CONFIG.DEFAULT_COOLDOWN_MINUTES)) {
      return NextResponse.json(
        { success: false, error: 'Slack cooldown active for this rule' },
        { status: 429 }
      );
    }

    // Slack 웹훅으로 메시지 발송
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Slack API] Send failed:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Slack API error: ${response.status}` },
        { status: 502 }
      );
    }

    // 성공 시 쿨다운 및 카운트 업데이트
    if (ruleId) {
      slackCooldowns.set(ruleId, Date.now());
    }
    dailySlackCount++;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Slack API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
