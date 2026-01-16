# 38-01 Summary: LogAlertRule 타입 + Prisma 모델 + 알림 엔진

## Execution Status

| Task | Status | Notes |
|------|--------|-------|
| Task 1: LogAlertRule 타입 정의 | ✅ Done | Zod 스키마 + 타입 추출 |
| Task 2: Prisma LogAlertRule 모델 | ✅ Done | schema.prisma + db push |
| Task 3: log-alert-service 서비스 | ✅ Done | CRUD + 캐싱 |
| Task 4: log-alert-engine 평가 엔진 | ✅ Done | 키워드/패턴/빈도 조건 평가 |
| Task 5: AlertCategory 확장 | ✅ Done | 'log' 카테고리 추가 |

## Created Files

| File | Purpose |
|------|---------|
| `src/types/log-alert.ts` | LogAlertRule, LogAlertCondition Zod 스키마 |
| `src/lib/log-alert-service.ts` | 로그 알림 규칙 CRUD 서비스 |
| `src/lib/log-alert-engine.ts` | 로그 기반 알림 평가 엔진 |

## Modified Files

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | LogAlertRule 모델 추가 |
| `src/types/alert.ts` | AlertCategory에 'log' 추가 |
| `src/lib/alertEngine.ts` | log 카테고리 레이블 추가 |
| `src/components/admin/AlertRulesPanel.tsx` | log 카테고리 레이블 추가 |

## Commits

| Hash | Message |
|------|---------|
| `60fbf54` | feat(38-01): LogAlertRule 타입, Prisma 모델, 알림 엔진 구현 |

## Key Implementation Details

### LogAlertRule 타입

```typescript
// 조건 타입: keyword, pattern, frequency
export type LogAlertConditionType = 'keyword' | 'pattern' | 'frequency'

// 조건 구조
interface LogAlertCondition {
  type: LogAlertConditionType
  keywords?: string[]        // keyword 조건
  pattern?: string           // pattern 조건
  caseSensitive?: boolean    // 대소문자 구분
  threshold?: number         // frequency 조건
  windowMinutes?: number     // 시간 윈도우
  level?: LogLevel           // 타겟 레벨
}
```

### log-alert-engine 핵심 로직

```typescript
// 1. 소스 필터 확인 (sources, sourceIds)
// 2. 쿨다운 확인
// 3. 조건 타입별 평가
//    - keyword: 키워드 목록 중 하나라도 포함
//    - pattern: 정규식 매칭
//    - frequency: 시간 윈도우 내 발생 횟수
// 4. 트리거 시 NewAlert 생성 + 쿨다운 시작
```

### 빈도 추적기 (FrequencyTracker)

- 규칙별 이벤트 타임스탬프 추적
- 슬라이딩 윈도우 방식 (오래된 이벤트 자동 정리)
- 메모리 기반 (서버 재시작 시 초기화)

## Verification Checklist

- [x] Prisma 스키마 반영 (db push)
- [x] TypeScript 타입 체크 통과
- [x] npm run build 성공
- [x] AlertCategory 'log' 모든 곳에 추가

## Duration

~8min

## Next Steps

38-02: REST API + LogCollectorManager 통합
- /api/log-alerts 엔드포인트
- 로그 수집 시 실시간 알림 평가
- useLogAlerts 훅
