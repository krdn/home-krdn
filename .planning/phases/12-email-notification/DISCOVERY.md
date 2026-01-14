# Discovery: Email Notification Service

**Date:** 2026-01-15
**Phase:** 12-email-notification
**Level:** 2 (Standard Research)

## Research Question

이메일 알림 시스템을 위한 서비스 선택: Resend vs Nodemailer vs SendGrid

## Options Evaluated

### Option A: Resend (선택됨)

**Pros:**
- API 우선 설계 - Next.js API Routes와 자연스러운 통합
- SMTP 설정 불필요 - `await resend.emails.send()` 한 줄로 발송
- 무료 티어: 월 3,000 이메일, 일 100 이메일 (알림 시스템에 충분)
- TypeScript SDK 제공 (`resend` 패키지)
- React Email 템플릿 지원
- 현대적인 DX (개발자 경험)

**Cons:**
- 외부 서비스 의존성
- 무료 티어 제한 있음
- 유료 전환 시 월 $20부터

### Option B: Nodemailer + SMTP

**Pros:**
- 무료 (오픈소스)
- 기존 SMTP 인프라 활용 가능
- 완전한 제어권

**Cons:**
- SMTP 서버 설정 필요
- 보일러플레이트 코드 많음
- 에러 핸들링 복잡
- 배달률(deliverability) 관리 필요

### Option C: SendGrid

**Pros:**
- 대용량 발송에 적합
- 강력한 분석/추적 기능

**Cons:**
- 복잡한 설정
- 무료 티어: 하루 100 이메일만
- 오버엔지니어링 (이 프로젝트 규모에 과함)

## Decision

**Resend 선택**

**이유:**
1. 홈서버 모니터링 알림용으로 무료 티어(월 3,000)가 충분
2. Next.js API Routes와 가장 자연스럽게 통합
3. TypeScript SDK로 타입 안전성 확보
4. 최소 설정으로 빠른 구현 가능

## Implementation Notes

### 설치
```bash
npm install resend
```

### 기본 사용법
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'alerts@yourdomain.com',
  to: 'admin@example.com',
  subject: '[Alert] CPU Critical',
  html: '<p>CPU usage exceeded 90%</p>',
});
```

### 환경 변수
- `RESEND_API_KEY`: Resend API 키
- `ALERT_EMAIL_FROM`: 발신자 이메일 (도메인 검증 필요)
- `ALERT_EMAIL_TO`: 수신자 이메일 (기본값)

### Rate Limiting 고려사항
- 무료 티어: 100 이메일/일 제한
- 쿨다운 메커니즘과 결합하여 남용 방지
- Critical 알림만 이메일 발송으로 제한 권장

## Sources

- [5 Best Email Services for Next.js - DEV Community](https://dev.to/ethanleetech/5-best-email-services-for-nextjs-1fa2)
- [Goodbye Nodemailer? Why I Switched to Resend](https://devdiwan.medium.com/goodbye-nodemailer-why-i-switched-to-resend-for-sending-emails-in-node-js-55e5a0dba899)
- [Resend Pricing](https://resend.com/pricing)
- [Send emails with Next.js - Resend](https://resend.com/nextjs)

---
*Discovery completed: 2026-01-15*
