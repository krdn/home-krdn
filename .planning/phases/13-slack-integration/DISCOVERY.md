# Phase 13: Slack Integration Discovery

## Research Summary

**Discovery Level:** 2 - Standard Research
**Duration:** ~15min
**Date:** 2026-01-15

## Research Question

Slack 웹훅을 통한 알림 전송 기능을 어떻게 구현할 것인가?

## Findings

### Slack Incoming Webhooks

**출처:** [Slack API Docs](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

#### 설정 단계

1. [api.slack.com/apps](https://api.slack.com/apps)에서 Slack App 생성
2. 앱 설정에서 "Incoming Webhooks" 활성화
3. "Add New Webhook to Workspace"로 채널 선택 후 Webhook URL 생성
4. 생성된 URL로 JSON POST 요청

#### 기본 메시지 형식

```json
{
  "text": "Hello, world."
}
```

#### Block Kit 메시지 형식

```json
{
  "text": "Fallback text for notifications",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Alert Title*\nDescription with `code` and _formatting_"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": ":warning: Severity: *critical*"
        }
      ]
    }
  ]
}
```

### 제약사항

- **URL 보안**: Webhook URL은 비밀처럼 취급 (환경 변수 필수)
- **Rate Limit**: 1 message/second per webhook
- **채널 고정**: Webhook 생성 시 선택한 채널로만 전송 가능

### 기존 패턴과의 통합

Phase 12 이메일 알림과 동일한 패턴 적용:
- `notification.ts` 타입 확장 (`SlackNotificationConfig`)
- `notificationStore.ts` 스토어 확장
- `useAlertNotifications.ts` 훅에 Slack 발송 로직 추가
- `SlackSettings.tsx` UI 컴포넌트

## Decision

### Approach: Native fetch + Block Kit

**선택 이유:**
1. **Zero dependency**: Slack SDK 불필요 (단순 HTTP POST)
2. **Block Kit**: 이메일보다 시각적으로 풍부한 메시지 포맷
3. **기존 패턴 재사용**: 이메일 알림과 동일한 쿨다운/일일 제한 적용

**비교 옵션:**

| Option | Pros | Cons |
|--------|------|------|
| Native fetch | Zero dependency, 단순 | - |
| @slack/webhook | 타입 안전성 | 의존성 추가 |
| @slack/web-api | 전체 API 접근 | 과도한 기능 |

**결론:** Native fetch 선택 (Webhook URL POST만 필요)

### Message Format: Block Kit

**알림 메시지 구조:**
```json
{
  "text": "[CRITICAL] CPU Usage High",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 CPU Usage High"
      }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*심각도:*\ncritical" },
        { "type": "mrkdwn", "text": "*현재 값:*\n95.5%" },
        { "type": "mrkdwn", "text": "*임계값:*\n90%" },
        { "type": "mrkdwn", "text": "*시각:*\n2026-01-15 12:00" }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "Home-KRDN 모니터링 시스템" }
      ]
    }
  ]
}
```

### Safety Mechanisms

- **쿨다운**: 같은 규칙 30분 쿨다운 (이메일과 동일)
- **일일 제한**: 100건/일 (Slack은 이메일보다 관대)
- **Critical만 발송 옵션**: 사용자 알림 피로도 방지

## Implementation Plan

### Files to Create/Modify

1. `src/types/notification.ts` - SlackNotificationConfig 타입 추가
2. `src/app/api/notifications/slack/route.ts` - Slack 웹훅 API Route
3. `src/stores/notificationStore.ts` - slackConfig 상태 추가
4. `src/hooks/useAlertNotifications.ts` - sendSlackAlert 함수 추가
5. `src/components/admin/SlackSettings.tsx` - Slack 설정 UI
6. `src/app/admin/alerts/page.tsx` - SlackSettings 컴포넌트 추가
7. `src/config/constants.ts` - SLACK_CONFIG 상수 추가

### Environment Variables

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

## Sources

- [Slack Incoming Webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)
- [Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Creating Rich Message Layouts](https://api.slack.com/messaging/composing/layouts)

---
*Discovery completed: 2026-01-15*
