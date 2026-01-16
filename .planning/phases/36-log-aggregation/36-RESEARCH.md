# Phase 36: Log Aggregation Backend - Research

**Researched:** 2026-01-16
**Domain:** Log Collection, Aggregation, Real-time Streaming
**Confidence:** HIGH

## Summary

Phase 36은 다중 소스에서 로그를 수집하여 통합하는 백엔드 서비스를 구축합니다. 연구 결과, Docker 컨테이너 로그는 기존 docker.ts의 Docker socket 통신 패턴을 확장하여 스트리밍 방식으로 수집하고, 시스템 로그는 journalctl 래퍼를 통해, 애플리케이션 로그는 기존 Pino 로거의 JSON 출력을 파일 테일링으로 수집하는 것이 표준 접근법입니다.

로그 저장소는 이미 프로젝트에서 사용 중인 Prisma 7 + SQLite 조합을 활용하되, 로그 특성상 쓰기 빈도가 높으므로 WAL 모드와 자동 정리(retention) 정책을 적용해야 합니다. WebSocket 실시간 스트리밍 인프라(Phase 9)가 이미 구축되어 있으므로, 이를 확장하여 로그 채널을 추가하는 것이 효율적입니다.

**Primary recommendation:** Docker API streaming + journalctl wrapper + file tailing으로 수집, SQLite에 저장, WebSocket으로 실시간 전송

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dockerode | 4.x | Docker API 클라이언트 | Docker socket 통신의 표준 라이브러리, TypeScript 지원, 로그 스트리밍 지원 |
| node-tail | 2.2.x | 파일 테일링 | Zero dependency, follow 옵션으로 log rotation 처리, 검증된 안정성 |
| journalctl (node-journalctl) | 2.x | systemd 저널 읽기 | journalctl JSON 출력 파싱, 이벤트 기반 스트리밍 |
| prisma | 7.x (existing) | 로그 저장소 | 이미 프로젝트에서 사용 중, SQLite WAL 모드 지원 |
| ws | 8.x (existing) | 실시간 스트리밍 | 이미 프로젝트 WebSocket 인프라 구축됨 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @logdna/tail-file | 4.x | 고급 파일 테일링 | 대용량 로그, backpressure 필요 시 대안 |
| chokidar | 5.x | 파일 감시 | 디렉토리 기반 다중 파일 감시 필요 시 |
| split2 | 4.x | 스트림 라인 분리 | 로그 스트림을 줄 단위로 파싱 |
| better-sqlite3 | 11.x (existing) | SQLite 드라이버 | 이미 프로젝트에서 사용 중 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SQLite | Grafana Loki | Loki는 대규모에 적합, SQLite는 소규모 자체호스팅에 최적 |
| dockerode | 직접 HTTP 요청 | 기존 docker.ts 패턴 유지 가능, dockerode는 스트림 처리 편의성 제공 |
| node-tail | @logdna/tail-file | @logdna가 backpressure 처리 우수, node-tail이 심플 |
| journalctl wrapper | systemd-journald native | 네이티브는 C 바인딩 필요, wrapper가 유지보수 용이 |

**Installation:**
```bash
npm install dockerode @types/dockerode node-tail journalctl split2
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── log-collector/           # 로그 수집 모듈
│   │   ├── docker-collector.ts  # Docker 컨테이너 로그 수집
│   │   ├── journal-collector.ts # systemd 저널 로그 수집
│   │   ├── file-collector.ts    # 파일 기반 로그 수집 (app logs)
│   │   └── index.ts             # 통합 컬렉터 매니저
│   ├── log-storage.ts           # 로그 저장소 (Prisma/SQLite)
│   └── log-streamer.ts          # WebSocket 로그 스트리밍
├── types/
│   └── log.ts                   # 로그 관련 타입/스키마 (Zod)
├── app/
│   └── api/
│       └── logs/
│           ├── route.ts         # GET /api/logs (목록 조회)
│           ├── stream/
│           │   └── route.ts     # GET /api/logs/stream (SSE fallback)
│           └── [source]/
│               └── route.ts     # GET /api/logs/[source] (소스별 조회)
└── components/
    └── logs/                    # 로그 뷰어 UI (Phase 37)
```

### Pattern 1: Multi-Source Log Collector
**What:** 여러 소스에서 로그를 통합 수집하는 추상화 레이어
**When to use:** Docker, journald, 파일 등 다양한 소스에서 로그를 일관된 형식으로 수집
**Example:**
```typescript
// Source: 프로젝트 패턴 기반 설계
import { z } from 'zod';

// 통합 로그 엔트리 스키마
export const LogEntrySchema = z.object({
  id: z.string().uuid(),
  source: z.enum(['docker', 'journal', 'app']),
  sourceId: z.string(),           // container id, unit name, file path
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  message: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

// 로그 수집기 인터페이스
interface LogCollector {
  source: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: 'log', handler: (entry: LogEntry) => void): void;
}
```

### Pattern 2: Docker Log Streaming (기존 docker.ts 확장)
**What:** Docker socket을 통한 실시간 컨테이너 로그 스트리밍
**When to use:** 컨테이너 로그를 실시간으로 수집할 때
**Example:**
```typescript
// Source: Docker API + 기존 docker.ts 패턴
import http from 'http';

const DOCKER_SOCKET = process.env.DOCKER_HOST || '/var/run/docker.sock';

export async function streamContainerLogs(
  containerId: string,
  onLog: (log: string, stream: 'stdout' | 'stderr') => void,
  options: { tail?: number; since?: number } = {}
): Promise<() => void> {
  const { tail = 100, since = 0 } = options;

  return new Promise((resolve, reject) => {
    const req = http.request({
      socketPath: DOCKER_SOCKET,
      path: `/containers/${containerId}/logs?stdout=true&stderr=true&follow=true&tail=${tail}&since=${since}&timestamps=true`,
      method: 'GET',
    }, (res) => {
      // Docker 로그 스트림 처리 (8-byte header)
      res.on('data', (chunk: Buffer) => {
        const { message, stream } = parseDockerLogChunk(chunk);
        onLog(message, stream);
      });

      // cleanup 함수 반환
      resolve(() => req.destroy());
    });

    req.on('error', reject);
    req.end();
  });
}

// Docker 로그 청크 파싱 (stdout/stderr 분리)
function parseDockerLogChunk(buffer: Buffer): { message: string; stream: 'stdout' | 'stderr' } {
  const streamType = buffer[0]; // 1 = stdout, 2 = stderr
  const size = buffer.readUInt32BE(4);
  const message = buffer.slice(8, 8 + size).toString('utf8').trim();
  return { message, stream: streamType === 1 ? 'stdout' : 'stderr' };
}
```

### Pattern 3: File Tailing with node-tail
**What:** 애플리케이션 로그 파일 실시간 모니터링
**When to use:** Pino JSON 로그 파일 등 파일 기반 로그 수집
**Example:**
```typescript
// Source: node-tail 공식 문서
import { Tail } from 'tail';

export function createFileTailer(
  filePath: string,
  onLine: (line: string) => void,
  onError: (error: Error) => void
): Tail {
  const tail = new Tail(filePath, {
    follow: true,        // log rotation 시 자동 재연결
    fromBeginning: false, // 기존 로그는 건너뜀
    useWatchFile: true,   // polling 방식 (NFS 등 호환)
  });

  tail.on('line', onLine);
  tail.on('error', onError);

  return tail;
}

// Pino JSON 로그 파싱
function parsePinoLog(line: string): LogEntry | null {
  try {
    const log = JSON.parse(line);
    return {
      id: crypto.randomUUID(),
      source: 'app',
      sourceId: log.module || 'unknown',
      level: log.level || 'info',
      message: log.msg,
      timestamp: new Date(log.time),
      metadata: log,
    };
  } catch {
    return null;
  }
}
```

### Pattern 4: Journal Log Collection
**What:** systemd journald에서 시스템 로그 수집
**When to use:** 시스템 서비스 로그, 부팅 로그 등 시스템 레벨 로그 필요 시
**Example:**
```typescript
// Source: node-journalctl 문서
import Journalctl from 'journalctl';

export function createJournalCollector(
  options: { unit?: string; identifier?: string; since?: string },
  onLog: (log: LogEntry) => void
): Journalctl {
  const journal = new Journalctl({
    unit: options.unit,       // e.g., 'docker.service'
    identifier: options.identifier,
    since: options.since || '-1h',  // 최근 1시간
  });

  journal.on('event', (event) => {
    onLog({
      id: crypto.randomUUID(),
      source: 'journal',
      sourceId: event._SYSTEMD_UNIT || event.SYSLOG_IDENTIFIER || 'system',
      level: mapJournalPriority(event.PRIORITY),
      message: event.MESSAGE,
      timestamp: new Date(parseInt(event.__REALTIME_TIMESTAMP) / 1000),
      metadata: event,
    });
  });

  return journal;
}

// journald priority를 로그 레벨로 매핑
function mapJournalPriority(priority: string): LogEntry['level'] {
  const p = parseInt(priority);
  if (p <= 2) return 'fatal';
  if (p === 3) return 'error';
  if (p === 4) return 'warn';
  if (p <= 6) return 'info';
  return 'debug';
}
```

### Pattern 5: SQLite Log Storage with Retention
**What:** 로그를 SQLite에 저장하고 자동 정리
**When to use:** 로그 영구 저장 및 검색 필요 시
**Example:**
```typescript
// Prisma 스키마 추가 (schema.prisma)
// model LogEntry {
//   id        String   @id @default(uuid())
//   source    String   // docker, journal, app
//   sourceId  String   // container id, unit name, etc.
//   level     String   // trace, debug, info, warn, error, fatal
//   message   String
//   timestamp DateTime @default(now())
//   metadata  String?  // JSON string
//   createdAt DateTime @default(now())
//
//   @@index([source, timestamp])
//   @@index([level, timestamp])
//   @@index([timestamp])
// }

// 로그 저장 서비스
export class LogStorage {
  constructor(private prisma: PrismaClient) {}

  async write(entry: LogEntry): Promise<void> {
    await this.prisma.logEntry.create({
      data: {
        ...entry,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  }

  async writeBatch(entries: LogEntry[]): Promise<void> {
    // 배치 삽입으로 성능 최적화
    await this.prisma.logEntry.createMany({
      data: entries.map(e => ({
        ...e,
        metadata: e.metadata ? JSON.stringify(e.metadata) : null,
      })),
    });
  }

  // 보존 기간 지난 로그 정리
  async cleanup(retentionDays: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.prisma.logEntry.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });

    return result.count;
  }
}
```

### Anti-Patterns to Avoid
- **각 소스별 저장소 분리:** 로그를 Docker용, 시스템용으로 따로 저장하면 통합 검색 불가. 단일 저장소에 source 필드로 구분.
- **동기식 로그 쓰기:** 로그 저장이 애플리케이션 성능에 영향. 배치 삽입 또는 비동기 큐 사용.
- **무한 로그 보존:** SQLite 파일이 무한정 커짐. 반드시 retention 정책과 VACUUM 적용.
- **원시 Docker 로그 헤더 무시:** Docker 로그 스트림은 8바이트 헤더 포함. 파싱 없이 저장하면 깨진 로그.
- **모든 로그 레벨 실시간 전송:** debug/trace 로그까지 WebSocket 전송하면 클라이언트 과부하. 레벨 필터링 필수.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Docker 로그 스트리밍 | HTTP 스트림 직접 구현 | dockerode 또는 기존 docker.ts 확장 | Docker 로그 프로토콜 복잡 (8바이트 헤더, TTY 모드 차이) |
| 파일 테일링 | fs.watch + readline | node-tail 또는 @logdna/tail-file | log rotation, truncation 처리 복잡 |
| journald 읽기 | journalctl CLI spawn | node-journalctl | JSON 파싱, 스트리밍 처리 이미 구현됨 |
| 로그 로테이션 | 수동 파일 관리 | file-stream-rotator (기록 시) | 날짜/크기 기반 로테이션 복잡 |
| SQLite VACUUM | 수동 실행 | auto_vacuum PRAGMA | 주기적 정리 자동화 |

**Key insight:** 로그 수집은 단순해 보이지만 edge case가 많음 (log rotation, file truncation, stream backpressure, Docker TTY/non-TTY 차이). 검증된 라이브러리 사용이 필수.

## Common Pitfalls

### Pitfall 1: Docker 로그 헤더 무시
**What goes wrong:** Docker 컨테이너 로그가 깨져서 저장됨, 특수 문자나 바이너리 데이터 포함
**Why it happens:** Docker 로그 API는 각 로그 라인에 8바이트 헤더 포함 (stream type + size)
**How to avoid:** 반드시 헤더 파싱 로직 구현. 기존 docker.ts의 `cleanDockerLogs` 참조.
**Warning signs:** 로그 메시지 앞에 깨진 문자, `[8]` 같은 제어 문자 출현

### Pitfall 2: SQLite 파일 크기 폭증
**What goes wrong:** 로그 DB 파일이 수 GB로 커져서 디스크 풀, 쿼리 느려짐
**Why it happens:** 로그는 계속 쌓이고, DELETE 해도 SQLite 파일 크기는 줄지 않음
**How to avoid:**
1. Retention 정책: 7일 이상 로그 자동 삭제
2. auto_vacuum 모드 활성화: `PRAGMA auto_vacuum = INCREMENTAL;`
3. 주기적 VACUUM 실행 (예: 매일 새벽)
**Warning signs:** DB 파일 크기 지속 증가, 쿼리 시간 증가

### Pitfall 3: 메모리 누수 (스트림 미정리)
**What goes wrong:** Node.js 프로세스 메모리 계속 증가, 결국 OOM 크래시
**Why it happens:** Docker 로그 스트림, file tail 인스턴스를 시작만 하고 정리하지 않음
**How to avoid:**
1. 모든 수집기에 stop() 메서드 구현
2. 컨테이너 종료 시 해당 스트림 정리
3. 앱 종료 시 전체 수집기 정리 (graceful shutdown)
**Warning signs:** `process.memoryUsage().heapUsed` 지속 증가

### Pitfall 4: WebSocket 과부하
**What goes wrong:** 클라이언트 브라우저 멈춤, 네트워크 대역폭 소진
**Why it happens:** 모든 로그를 실시간으로 전송, 특히 debug/trace 레벨까지
**How to avoid:**
1. 기본 필터: info 이상만 전송
2. 클라이언트별 구독 레벨 설정 가능
3. 배치 전송: 100ms 단위로 모아서 전송
4. 백프레셔: 클라이언트 처리 못하면 드랍
**Warning signs:** WebSocket 메시지 큐 증가, 클라이언트 렉

### Pitfall 5: journald 접근 권한
**What goes wrong:** "Permission denied" 에러로 시스템 로그 수집 불가
**Why it happens:** journald는 기본적으로 root 또는 systemd-journal 그룹만 읽기 가능
**How to avoid:**
1. Docker 컨테이너 내에서는 호스트 journal 접근 불가 (볼륨 마운트 필요)
2. 또는 journald 대신 파일 기반 syslog 사용
3. 또는 별도 log forwarder 프로세스를 호스트에서 실행
**Warning signs:** journalctl 명령 실패, EACCES 에러

## Code Examples

Verified patterns from official sources:

### Docker 로그 스트림 파싱
```typescript
// Source: Docker API 문서 + 기존 docker.ts 패턴
function parseDockerLogStream(buffer: Buffer): Array<{
  stream: 'stdout' | 'stderr';
  message: string;
  timestamp?: Date;
}> {
  const entries: Array<{ stream: 'stdout' | 'stderr'; message: string; timestamp?: Date }> = [];
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;

    const streamType = buffer[offset]; // 0=stdin, 1=stdout, 2=stderr
    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;

    if (offset + size > buffer.length) break;

    const content = buffer.toString('utf8', offset, offset + size).trim();
    offset += size;

    // timestamps=true 옵션 사용 시 ISO 형식 타임스탬프 포함
    const timestampMatch = content.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);

    entries.push({
      stream: streamType === 2 ? 'stderr' : 'stdout',
      message: timestampMatch ? timestampMatch[2] : content,
      timestamp: timestampMatch ? new Date(timestampMatch[1]) : undefined,
    });
  }

  return entries;
}
```

### WebSocket 로그 채널 확장 (기존 websocket.ts 패턴)
```typescript
// Source: 기존 src/types/websocket.ts 패턴 확장
import { z } from 'zod';

// 로그 구독 메시지 추가
export const WSLogSubscribeMessageSchema = z.object({
  type: z.literal('subscribe-logs'),
  sources: z.array(z.enum(['docker', 'journal', 'app'])).optional(), // 전체 또는 특정 소스
  containers: z.array(z.string()).optional(), // 특정 컨테이너만
  minLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  timestamp: z.number(),
});

// 로그 데이터 메시지
export const WSLogMessageSchema = z.object({
  type: z.literal('logs'),
  data: z.array(z.object({
    id: z.string(),
    source: z.enum(['docker', 'journal', 'app']),
    sourceId: z.string(),
    level: z.string(),
    message: z.string(),
    timestamp: z.string(), // ISO string
  })),
  timestamp: z.number(),
});

export type WSLogSubscribeMessage = z.infer<typeof WSLogSubscribeMessageSchema>;
export type WSLogMessage = z.infer<typeof WSLogMessageSchema>;
```

### 로그 배치 버퍼
```typescript
// Source: 일반적인 로그 집계 패턴
export class LogBatchBuffer {
  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly onFlush: (entries: LogEntry[]) => Promise<void>,
    private readonly batchSize: number = 100,
    private readonly flushInterval: number = 1000 // ms
  ) {}

  add(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.length === 0) return;

    const entries = this.buffer;
    this.buffer = [];

    await this.onFlush(entries);
  }

  async stop(): Promise<void> {
    await this.flush();
  }
}
```

## State of the Art (2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ELK Stack (Elasticsearch) | Grafana Loki | 2023-2024 | 대규모에서 비용 효율적, 레이블 기반 인덱싱 |
| Winston 로깅 | Pino 로깅 | 2022-2023 | 5-10배 성능 향상, JSON 기본 출력 |
| fs.watchFile | chokidar v5 | 2025 | ESM 전용, Node.js 20+ 필수 |
| node-tail CoffeeScript | node-tail ES6 | 2020 | 순수 JavaScript, 의존성 제로 |
| 수동 log rotation | file-stream-rotator | 계속 표준 | symlink 기반 tailing 지원 |

**New tools/patterns to consider:**
- **Node.js 내장 SQLite** (실험적): 외부 패키지 없이 SQLite 사용 가능, 하지만 아직 실험적
- **Chokidar v5**: ESM 전용, Node.js 20+ 필수 - 프로젝트가 ESM이면 업그레이드 권장
- **Pino 기본 JSON**: 프로젝트에서 이미 Pino 사용 중, 로그 파싱 용이

**Deprecated/outdated:**
- **bunyan**: 더 이상 활발히 유지보수되지 않음, Pino로 대체
- **morgan + Winston 조합**: 복잡하고 느림, Pino 단일 사용 권장
- **chokidar v3**: v4에서 TypeScript 재작성, v5에서 ESM 전용 - 구버전 사용 자제

## Open Questions

Things that couldn't be fully resolved:

1. **Docker 컨테이너 볼륨 마운트 journald 접근**
   - What we know: Docker 컨테이너 내에서 호스트 journald 직접 접근 어려움
   - What's unclear: `/run/log/journal` 볼륨 마운트로 충분한지, 권한 문제 발생 여부
   - Recommendation: 초기 구현은 Docker + 파일 로그만 지원, journald는 후속 작업으로

2. **SQLite WAL 모드와 Prisma 7 호환성**
   - What we know: SQLite WAL 모드가 쓰기 성능 향상
   - What's unclear: Prisma 7이 connection URL에서 `?mode=wal` 지원 여부
   - Recommendation: 테스트 후 적용, 또는 PRAGMA로 런타임 설정

3. **대량 로그 시 WebSocket 백프레셔 전략**
   - What we know: 클라이언트가 처리 못하면 서버 메모리 증가
   - What's unclear: ws 라이브러리의 백프레셔 처리 방식
   - Recommendation: 클라이언트별 버퍼 제한 + 드랍 정책 구현

## Sources

### Primary (HIGH confidence)
- Docker Engine API: `/containers/{id}/logs` 엔드포인트 스트리밍 옵션
- Pino 공식 문서: JSON 로그 포맷, 타임스탬프 설정
- node-tail GitHub: v2.2.6 API, follow 옵션
- SQLite 공식 문서: WAL 모드, VACUUM

### Secondary (MEDIUM confidence)
- [A Complete Guide to Pino Logging](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/) - Pino 설정 가이드
- [Docker Logs Tail Guide](https://signoz.io/guides/docker-logs-tail/) - Docker 로그 스트리밍 패턴
- [node-journalctl GitHub](https://github.com/jue89/node-journalctl) - journald Node.js 래퍼
- [@logdna/tail-file npm](https://www.npmjs.com/package/@logdna/tail-file) - 고급 파일 테일링
- [dockerode GitHub](https://github.com/apocas/dockerode) - Docker Node.js 클라이언트
- [SQLite VACUUM](https://www.sqlite.org/lang_vacuum.html) - 데이터베이스 정리

### Tertiary (LOW confidence)
- WebSearch 결과: 로그 집계 아키텍처 패턴 (다중 소스 확인 필요)
- Community blog posts: 실시간 대시보드 WebSocket 패턴

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 기존 프로젝트 패턴과 공식 문서 기반
- Architecture: HIGH - 기존 WebSocket, Docker 패턴 확장
- Pitfalls: MEDIUM - 일부 경험 기반, 공식 문서 확인 필요
- journald 통합: LOW - Docker 환경에서 테스트 필요

**Research date:** 2026-01-16
**Valid until:** 2026-02-15 (30일 - 안정적 영역)
