# 05-02 Summary: 히스토리 저장 및 조회 기능

## 완료 상태

**Status:** COMPLETED
**Date:** 2026-01-14

## 구현 내용

### Task 1: 메트릭 히스토리 스토어 생성

**파일:** `src/lib/metricsHistory.ts`

- `MetricsSnapshot` 타입 정의 (timestamp, cpu, memory, disk, networkRx, networkTx)
- `MetricsHistoryStore` 클래스 구현 (싱글톤 패턴)
- 순환 버퍼 방식으로 최대 60개 스냅샷 관리 (1시간, 1분 간격)
- 메서드: `addSnapshot()`, `getHistory()`, `getLatest()`, `getSize()`, `clear()`

### Task 2: 히스토리 수집 스케줄러 구현

**파일:** `src/lib/metricsScheduler.ts`

- 1분 간격 자동 메트릭 수집
- `startMetricsCollection()`, `stopMetricsCollection()` 함수
- 네트워크 트래픽 합계 계산 (lo 제외)
- 수집 중복 방지 로직 (`isCollecting` 플래그)
- `collectNow()` 수동 수집 함수

### Task 3: 히스토리 API 엔드포인트 추가

**파일:** `src/app/api/system/history/route.ts`

- `GET /api/system/history` 엔드포인트
- `?minutes` 쿼리 파라미터로 시간 범위 지정 (기본값: 60)
- 첫 요청 시 스케줄러 자동 시작
- 응답에 스케줄러 상태 포함

### Task 4: 히스토리 훅 생성

**파일:** `src/hooks/useMetricsHistory.ts`

- `useMetricsHistory(minutes)` 훅
- 30초마다 히스토리 데이터 자동 갱신
- 차트 렌더링용 `ChartDataPoint` 포맷 제공
- 네트워크 트래픽 MB 단위 변환

### Task 5: 히스토리 스토어 테스트 작성

**파일:** `src/lib/metricsHistory.test.ts`

- 23개 테스트 케이스
- 스냅샷 추가/조회 테스트
- 최대 크기 제한 테스트 (순환 버퍼)
- 시간 범위 필터링 테스트
- 경계 케이스 및 데이터 무결성 테스트

## 생성된 파일

| 파일 | 설명 |
|------|------|
| `src/lib/metricsHistory.ts` | 메트릭 히스토리 스토어 |
| `src/lib/metricsScheduler.ts` | 수집 스케줄러 |
| `src/app/api/system/history/route.ts` | 히스토리 API |
| `src/hooks/useMetricsHistory.ts` | 클라이언트 훅 |
| `src/lib/metricsHistory.test.ts` | 테스트 파일 |

## 커밋 이력

1. `feat(05-02): 메트릭 히스토리 스토어 생성`
2. `feat(05-02): 메트릭 수집 스케줄러 구현`
3. `feat(05-02): 메트릭 히스토리 API 엔드포인트 추가`
4. `feat(05-02): 메트릭 히스토리 훅 생성`
5. `test(05-02): 메트릭 히스토리 스토어 테스트 추가`
6. `fix(05-02): system API 테스트 mock 데이터 수정`

## 검증 결과

```
빌드: PASS
테스트: 103개 통과 (metricsHistory.test.ts: 23개)
```

## API 사용 예시

```bash
# 최근 1시간 히스토리 조회 (기본값)
curl http://localhost:3000/api/system/history

# 최근 30분 히스토리 조회
curl http://localhost:3000/api/system/history?minutes=30

# 응답 예시
{
  "success": true,
  "data": [
    {
      "timestamp": 1705248000000,
      "cpu": 45,
      "memory": 60,
      "disk": 70,
      "networkRx": 123456789,
      "networkTx": 987654321
    }
  ],
  "meta": {
    "count": 30,
    "minutes": 30,
    "schedulerRunning": true
  }
}
```

## 클라이언트 훅 사용 예시

```tsx
import { useMetricsHistory } from '@/hooks/useMetricsHistory';

function MetricsChart() {
  const { chartData, loading, error } = useMetricsHistory(30);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <LineChart data={chartData}>
      {/* 차트 렌더링 */}
    </LineChart>
  );
}
```

## 다음 단계

- **05-03:** 실시간 차트 컴포넌트 구현 (히스토리 데이터 시각화)

---
*Generated: 2026-01-14*
