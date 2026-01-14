# Phase 02-01: 중복 유틸리티 함수 통합 - 완료

## 개요

중복된 유틸리티 함수(`formatBytes`, `formatUptime`)를 통합하여 코드 일관성을 확보했습니다.

## 완료된 작업

### Task 1: system.ts에서 중복 함수 제거
- **파일**: `src/lib/system.ts`
- **변경 내용**:
  - `formatBytes` 함수 정의 삭제 (9줄)
  - `formatUptime` 함수 정의 삭제 (12줄)
  - `import { formatUptime } from './utils'` 추가
  - `getQuickStats()`에서 import된 `formatUptime` 사용
- **결과**: 29줄 감소

### Task 2: API route import 경로 변경
- **파일**: `src/app/api/system/route.ts`
- **변경 전**:
  ```typescript
  import { getSystemMetrics, formatBytes, formatUptime } from '@/lib/system';
  ```
- **변경 후**:
  ```typescript
  import { getSystemMetrics } from '@/lib/system';
  import { formatBytes, formatUptime } from '@/lib/utils';
  ```

## 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| TypeScript 빌드 | 통과 |
| `npm run build` | 성공 |
| 수정 파일 lint | 에러 없음 |
| 함수 단일 소스 | 확인 (utils.ts에서만 export) |

## 커밋 이력

| Task | 커밋 해시 | 메시지 |
|------|-----------|--------|
| Task 1 | `92efc4b` | refactor(02-01): system.ts에서 중복 유틸리티 함수 제거 |
| Task 2 | `5377519` | refactor(02-01): API route import 경로 변경 |

## 수정된 파일

- `src/lib/system.ts` - 중복 함수 제거, utils에서 import
- `src/app/api/system/route.ts` - import 경로 변경

## 참고 사항

- 기존 프로젝트에 lint 경고/에러가 있으나 현재 작업 범위와 무관
- `formatBytes` (utils.ts): `decimals` 파라미터 지원으로 더 유연함
- `formatUptime` (utils.ts): 기존 system.ts 버전과 출력 형식이 약간 다름
  - utils.ts: `"1d 2h"` 형식
  - system.ts(삭제됨): `"1d 2h 3m"` 형식
