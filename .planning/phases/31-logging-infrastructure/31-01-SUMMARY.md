# Summary 31-01: Logger 서비스 구현

## Overview

pino 기반 중앙집중식 로깅 인프라를 구축했습니다.

## Completed Tasks

### Task 1: pino 설치 ✅

```bash
npm install pino pino-pretty
```

### Task 2: Logger 서비스 구현 ✅

**파일**: `src/lib/logger.ts`

**주요 기능**:
```typescript
// 기본 로거
import { logger } from '@/lib/logger';
logger.info('메시지', { key: 'value' });

// 요청별 로거
const log = createRequestLogger(request);
log.info('요청 처리 중');

// 모듈별 로거
const log = createModuleLogger('docker');
log.info('컨테이너 시작', { containerId: 'abc' });
```

**로그 레벨**:
- `trace`: 매우 상세한 디버깅
- `debug`: 개발 시 유용한 정보
- `info`: 일반적인 운영 정보
- `warn`: 잠재적 문제 상황
- `error`: 에러 상황
- `fatal`: 치명적 에러

### Task 3: error-logger.ts 마이그레이션 ✅

**변경 내용**:
- `console.error/warn` → `logger.error/warn`
- 로그 컨텍스트에 code, statusCode, stack 포함
- logInfo, logDebug 헬퍼 추가

## Files Created/Modified

- `src/lib/logger.ts` (신규)
- `src/lib/error-logger.ts` (마이그레이션)
- `package.json` (pino, pino-pretty 추가)

## Key Features

### 환경별 설정

**개발 환경** (pretty-print):
```
18:25:00 INFO 사용자 로그인 { userId: '123' }
```

**프로덕션** (JSON):
```json
{"level":"info","time":"2026-01-15T18:25:00.000Z","msg":"사용자 로그인","userId":"123"}
```

### 컨텍스트 바인딩

```typescript
// 요청 컨텍스트 자동 포함
const log = createRequestLogger(request);
// 모든 로그에 requestId, path, method 자동 추가
log.info('처리 중'); // { requestId: 'uuid', path: '/api/users', method: 'POST', msg: '처리 중' }
```

## Environment Variables

```env
# 로그 레벨 설정 (선택)
LOG_LEVEL=info  # trace | debug | info | warn | error | fatal
```

## Verification

- [x] `npm run build` 성공
- [x] Logger 서비스 TypeScript 타입 검증
- [x] error-logger 기존 API 호환성 유지

## Commit

```
feat(31-01): pino 기반 Logger 서비스 구현

- src/lib/logger.ts 중앙집중식 로거 생성
- error-logger.ts pino 마이그레이션
- 환경별 설정 (개발: pretty-print, 프로덕션: JSON)
```
