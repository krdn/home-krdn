# Phase 43: Port Scanner & Guide - Research

**Researched:** 2026-01-19
**Domain:** System Port Scanning, Docker Integration, Node.js Network
**Confidence:** HIGH

## Summary

Phase 43은 시스템의 실제 열린 포트를 스캔하여 Phase 33에서 구현된 PortRegistry와 비교하고, 신규 개발 시 사용 가능한 포트를 안내하는 기능을 구현합니다.

이 프로젝트는 이미 Docker 소켓 접근 권한(`/var/run/docker.sock`)과 시스템 명령어 실행(`child_process.execSync`)을 사용하는 인프라가 갖춰져 있습니다. 기존 `src/lib/docker.ts`의 Docker API 클라이언트와 `src/lib/system.ts`의 시스템 메트릭 수집 패턴을 확장하여 포트 스캔 기능을 구현합니다.

**Primary recommendation:** `ss -tlnH` 명령어 파싱 + Docker API 포트 바인딩 조회를 조합하여 호스트 시스템의 열린 포트를 수집하고, 기존 PortRegistry와 비교하는 하이브리드 접근 방식 사용

## Standard Stack

이 Phase는 기존 프로젝트 스택을 활용하며 새로운 의존성이 필요하지 않습니다.

### Core (기존 활용)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| child_process | Node.js built-in | 시스템 명령어 실행 (ss, netstat) | 기존 system.ts에서 사용 중 |
| http (Unix socket) | Node.js built-in | Docker API 통신 | 기존 docker.ts에서 사용 중 |
| Zod | ^4.3.5 | 런타임 검증 | 프로젝트 표준 |

### Supporting (선택적)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| portscanner | 2.2.0 | TCP 포트 상태 확인 | TCP connect 방식 스캔 필요 시 |
| tcp-port-used | latest | 단일 포트 사용 여부 확인 | 간단한 포트 체크만 필요 시 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ss -tlnH` 파싱 | `portscanner` npm | 외부 의존성 추가, 하지만 크로스 플랫폼 |
| Docker API 직접 호출 | `dockerode` npm | 기존 docker.ts와 중복, 불필요한 의존성 |
| 순수 TCP 소켓 스캔 | `ss` 명령어 | 스캔 속도 느림, 권한 문제 가능 |

**Installation:**
```bash
# 새로운 의존성 불필요 - 기존 스택 활용
# 선택적으로 portscanner 추가 시:
npm install portscanner
npm install -D @types/portscanner
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── port-scanner.ts           # 신규: 포트 스캔 서비스
│   ├── port-service.ts           # 기존: PortRegistry CRUD
│   ├── docker.ts                 # 기존: Docker API 클라이언트
│   └── system.ts                 # 기존: 시스템 메트릭 (참고 패턴)
├── app/api/ports/
│   ├── scan/route.ts             # 신규: GET /api/ports/scan
│   ├── compare/route.ts          # 신규: GET /api/ports/compare
│   └── guide/route.ts            # 신규: GET /api/ports/guide
├── components/ports/
│   ├── PortScanner.tsx           # 신규: 스캔 결과 UI
│   ├── PortComparison.tsx        # 신규: 비교 결과 UI
│   └── PortGuide.tsx             # 신규: 범위별 가이드 UI
└── types/
    └── port-scanner.ts           # 신규: 스캔 관련 타입
```

### Pattern 1: 하이브리드 포트 스캔

**What:** ss 명령어 + Docker API 조합으로 호스트 열린 포트 수집
**When to use:** Docker 컨테이너 내부에서 호스트 포트 정보 필요 시
**Example:**

```typescript
// Source: 기존 system.ts 패턴 확장
import { execSync } from 'child_process';
import { listContainers } from '@/lib/docker';

interface SystemPort {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'LISTEN';
  process?: string;
  pid?: number;
}

/**
 * ss -tlnH 출력을 파싱합니다.
 * 형식: State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
 */
export function parseSsOutput(output: string): SystemPort[] {
  const ports: SystemPort[] = [];
  const lines = output.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // ss -tlnH 출력: LISTEN 0 4096 0.0.0.0:22 0.0.0.0:* users:(("sshd",pid=575,fd=3))
    const match = line.match(
      /LISTEN\s+\d+\s+\d+\s+[\d\.\*:]+:(\d+)\s+[\d\.\*:]+:\*\s*(?:users:\(\("([^"]+)",pid=(\d+),/
    );

    if (match) {
      ports.push({
        port: parseInt(match[1], 10),
        protocol: 'tcp',
        state: 'LISTEN',
        process: match[2] || undefined,
        pid: match[3] ? parseInt(match[3], 10) : undefined,
      });
    } else {
      // 프로세스 정보 없는 경우
      const simpleMatch = line.match(/LISTEN\s+\d+\s+\d+\s+[\d\.\*:]+:(\d+)/);
      if (simpleMatch) {
        ports.push({
          port: parseInt(simpleMatch[1], 10),
          protocol: 'tcp',
          state: 'LISTEN',
        });
      }
    }
  }

  return ports;
}

/**
 * 시스템에서 열린 TCP 포트를 스캔합니다.
 */
export async function scanSystemPorts(): Promise<SystemPort[]> {
  try {
    // -t: TCP, -l: listening, -n: numeric, -H: no header
    const output = execSync('ss -tlnH 2>/dev/null || netstat -tlnp 2>/dev/null').toString();
    return parseSsOutput(output);
  } catch {
    return [];
  }
}
```

### Pattern 2: Docker 포트 바인딩 수집

**What:** Docker API로 컨테이너별 호스트 포트 매핑 조회
**When to use:** 컨테이너가 사용 중인 호스트 포트 파악 시
**Example:**

```typescript
// Source: 기존 docker.ts 확장
interface DockerPortBinding {
  containerPort: number;
  hostPort: number;
  protocol: string;
  containerId: string;
  containerName: string;
}

/**
 * 모든 Docker 컨테이너의 포트 바인딩을 조회합니다.
 */
export async function getDockerPortBindings(): Promise<DockerPortBinding[]> {
  const containers = await listContainers(true); // 모든 컨테이너
  const bindings: DockerPortBinding[] = [];

  for (const container of containers) {
    // ports 형식: "8082:80/tcp"
    for (const portStr of container.ports) {
      const match = portStr.match(/(\d+):(\d+)\/(\w+)/);
      if (match) {
        bindings.push({
          hostPort: parseInt(match[1], 10),
          containerPort: parseInt(match[2], 10),
          protocol: match[3],
          containerId: container.id,
          containerName: container.name,
        });
      }
    }
  }

  return bindings;
}
```

### Pattern 3: Registry vs System 비교 알고리즘

**What:** 등록된 포트와 실제 사용 중 포트 비교
**When to use:** 포트 불일치 감지 및 리포트 시
**Example:**

```typescript
interface PortComparisonResult {
  registeredAndUsed: PortRegistryDto[];      // 정상: 등록되고 사용 중
  registeredButUnused: PortRegistryDto[];    // 경고: 등록됐지만 사용 안 함
  usedButUnregistered: SystemPort[];         // 경고: 미등록 포트 사용 중
  conflicts: Array<{                          // 충돌: 다른 프로세스가 사용
    registered: PortRegistryDto;
    actual: SystemPort;
  }>;
}

export async function comparePortsWithRegistry(): Promise<PortComparisonResult> {
  const [systemPorts, dockerPorts, registeredPorts] = await Promise.all([
    scanSystemPorts(),
    getDockerPortBindings(),
    getAllPorts(),
  ]);

  // 모든 실제 사용 중 포트 통합
  const actualPortSet = new Set<number>();
  const actualPortMap = new Map<number, SystemPort | DockerPortBinding>();

  systemPorts.forEach(p => {
    actualPortSet.add(p.port);
    actualPortMap.set(p.port, p);
  });

  dockerPorts.forEach(p => {
    actualPortSet.add(p.hostPort);
    actualPortMap.set(p.hostPort, p);
  });

  const registeredSet = new Set(registeredPorts.map(p => p.port));

  return {
    registeredAndUsed: registeredPorts.filter(p => actualPortSet.has(p.port)),
    registeredButUnused: registeredPorts.filter(p => !actualPortSet.has(p.port)),
    usedButUnregistered: systemPorts.filter(p => !registeredSet.has(p.port)),
    conflicts: [], // 프로세스명 비교로 충돌 감지 (확장 가능)
  };
}
```

### Anti-Patterns to Avoid

- **Docker 컨테이너 내부에서 호스트 netns 직접 접근 시도:** nsenter 필요, 권한 복잡
- **전체 포트 범위 TCP 스캔:** 1-65535 스캔은 수 분 소요, ss 명령어가 즉시 결과
- **portscanner로 수천 개 포트 스캔:** 각 포트마다 TCP 연결 시도, 매우 느림
- **실시간 WebSocket 스트리밍 스캔:** 불필요한 복잡성, 폴링으로 충분

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ss/netstat 출력 파싱 | 복잡한 정규식 | 검증된 파싱 함수 + 테스트 | 출력 형식 OS별 차이 |
| TCP 포트 체크 | raw socket 구현 | `portscanner` 또는 `net.createConnection` | 타임아웃, 에러 처리 복잡 |
| Docker 포트 조회 | Docker CLI 파싱 | 기존 docker.ts API 확장 | 이미 검증된 구현 존재 |
| 포트 범위 시각화 | 커스텀 차트 | 기존 Badge + Progress 조합 | 프로젝트 UI 일관성 |

**Key insight:** 시스템 포트 스캔은 `ss` 명령어가 가장 효율적이며, Docker 포트는 이미 구현된 API로 조회 가능합니다. TCP 연결 방식 스캔은 특수한 경우(외부 호스트 스캔)에만 필요합니다.

## Common Pitfalls

### Pitfall 1: Docker 컨테이너 내부에서 호스트 포트 스캔 불가

**What goes wrong:** 컨테이너의 네트워크 네임스페이스는 호스트와 분리되어 `ss`가 컨테이너 포트만 표시
**Why it happens:** Docker의 네트워크 격리 기본 동작
**How to avoid:**
1. Docker 소켓 마운트로 Docker API를 통해 컨테이너 포트 바인딩 조회 (현재 구현됨)
2. 컨테이너 내부 `ss`는 컨테이너 자체 포트만 표시됨을 인지
3. 호스트 포트 직접 스캔이 필요하면 `host` 네트워크 모드 고려

**Warning signs:** 스캔 결과가 예상보다 적음, Docker 컨테이너 포트가 누락됨

**현재 프로젝트 상황:**
```yaml
# docker-compose.yml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro  # Docker API 접근 가능
```
Docker 소켓이 마운트되어 있으므로 Docker API로 컨테이너 포트 바인딩 조회 가능합니다.

### Pitfall 2: ss 명령어 출력 형식 차이

**What goes wrong:** Alpine, Debian, Ubuntu 등 배포판마다 ss 출력 형식이 미묘하게 다름
**Why it happens:** BusyBox ss vs iproute2 ss 차이
**How to avoid:**
1. `-H` (no header) 옵션으로 헤더 제거
2. 정규식을 유연하게 작성 (공백 패턴 `\s+`)
3. 파싱 실패 시 graceful degradation
4. 단위 테스트로 다양한 출력 형식 검증

**Warning signs:** 특정 환경에서 포트 목록이 비어있음

### Pitfall 3: 권한 부족으로 프로세스 정보 누락

**What goes wrong:** `ss -p` 옵션으로 프로세스 정보 조회 시 권한 필요
**Why it happens:** 다른 사용자의 프로세스 정보는 root 권한 필요
**How to avoid:**
1. 프로세스 정보는 optional로 처리
2. Docker 컨테이너 포트는 Docker API로 컨테이너명 조회
3. 프로세스 정보 없어도 포트 번호만으로 PortRegistry 매칭

**Warning signs:** process 필드가 undefined인 포트가 많음

### Pitfall 4: 포트 범위 스캔 시 성능 문제

**What goes wrong:** 1-65535 전체 범위 TCP 스캔 시 수 분 소요
**Why it happens:** 각 포트마다 TCP 연결 시도 + 타임아웃 대기
**How to avoid:**
1. `ss` 명령어 사용 (즉시 결과 반환)
2. TCP 스캔은 특정 범위만 (예: 카테고리별 범위)
3. 병렬 스캔 시 concurrency 제한 (100 이하)

**Warning signs:** API 응답 시간 10초 이상, 타임아웃 발생

## Code Examples

### ss 출력 파싱 (순수 함수)

```typescript
// Source: 기존 system.ts의 parseProcStat 패턴 참고
/**
 * ss -tlnH 출력을 파싱합니다.
 *
 * 입력 예시:
 * LISTEN 0   4096  0.0.0.0:22     0.0.0.0:*   users:(("sshd",pid=575,fd=3))
 * LISTEN 0   511   0.0.0.0:80     0.0.0.0:*
 * LISTEN 0   128   127.0.0.1:3000 0.0.0.0:*   users:(("node",pid=1234,fd=18))
 */
export function parseSsOutput(output: string): SystemPort[] {
  if (!output || typeof output !== 'string') {
    return [];
  }

  const ports: SystemPort[] = [];
  const lines = output.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // 로컬 주소에서 포트 추출: [IP]:PORT 형식
    // IPv4: 0.0.0.0:22, 127.0.0.1:3000
    // IPv6: [::]:22, [::1]:3000
    const localAddrMatch = line.match(
      /LISTEN\s+\d+\s+\d+\s+([\d\.\[\]:]+):(\d+)\s/
    );

    if (!localAddrMatch) continue;

    const port = parseInt(localAddrMatch[2], 10);
    if (isNaN(port)) continue;

    // 프로세스 정보 추출 (optional)
    const processMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);

    ports.push({
      port,
      protocol: 'tcp',
      state: 'LISTEN',
      process: processMatch?.[1],
      pid: processMatch?.[2] ? parseInt(processMatch[2], 10) : undefined,
    });
  }

  return ports;
}
```

### 포트 범위 시각화 데이터

```typescript
// Source: 기존 PORT_CATEGORY_RANGES 확장
import { PORT_CATEGORY_RANGES, type PortCategory } from '@/types/port';

interface PortRangeVisualization {
  category: PortCategory;
  label: string;
  start: number;
  end: number;
  total: number;
  used: number;
  available: number;
  usagePercent: number;
  ports: Array<{
    port: number;
    registered: boolean;  // PortRegistry에 등록됨
    active: boolean;      // 실제 사용 중
    projectName?: string;
  }>;
}

export async function getPortRangeVisualization(
  category: PortCategory
): Promise<PortRangeVisualization> {
  const range = PORT_CATEGORY_RANGES[category];
  const [registeredPorts, systemPorts] = await Promise.all([
    getPortsByCategory(category),
    scanSystemPorts(),
  ]);

  const systemPortSet = new Set(systemPorts.map(p => p.port));
  const registeredMap = new Map(registeredPorts.map(p => [p.port, p]));

  const ports: PortRangeVisualization['ports'] = [];
  let used = 0;

  for (let port = range.start; port <= range.end; port++) {
    const registered = registeredMap.get(port);
    const active = systemPortSet.has(port);

    if (registered || active) {
      used++;
      ports.push({
        port,
        registered: !!registered,
        active,
        projectName: registered?.projectName,
      });
    }
  }

  const total = range.end - range.start + 1;

  return {
    category,
    label: range.description,
    start: range.start,
    end: range.end,
    total,
    used,
    available: total - used,
    usagePercent: Math.round((used / total) * 100),
    ports,
  };
}
```

### API Route 예시

```typescript
// src/app/api/ports/scan/route.ts
import { NextResponse } from 'next/server';
import { scanSystemPorts, getDockerPortBindings } from '@/lib/port-scanner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ports/scan
 * 시스템에서 현재 열린 포트를 스캔합니다.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const [systemPorts, dockerPorts] = await Promise.all([
      scanSystemPorts(),
      getDockerPortBindings(),
    ]);

    return NextResponse.json({
      success: true,
      system: systemPorts,
      docker: dockerPorts,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Port Scan] 스캔 오류:', error);
    return NextResponse.json(
      { success: false, error: '포트 스캔에 실패했습니다' },
      { status: 500 }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| netstat -tlnp | ss -tlnH | 2010s | ss가 더 빠르고 정보가 풍부 |
| Docker ps --format | Docker API | 항상 | 프로그래매틱 접근, 타입 안전 |
| TCP connect scan | ss 명령어 파싱 | - | 즉시 결과, 권한 불필요 |

**Deprecated/outdated:**
- `netstat`: ss로 대체됨, 일부 컨테이너에서 미설치
- Docker CLI 파싱: API가 더 안정적이고 구조화됨

## Open Questions

### 1. 컨테이너 내부에서 호스트 네트워크 스캔

**What we know:**
- Docker 소켓 마운트로 Docker API 접근 가능
- 컨테이너 내부 `ss`는 컨테이너 네임스페이스만 표시
- Docker 포트 바인딩은 API로 조회 가능

**What's unclear:**
- non-Docker 프로세스 (호스트에서 직접 실행)의 포트는 컨테이너 내부에서 직접 확인 불가

**Recommendation:**
- Docker 컨테이너 포트: Docker API 사용 (구현됨)
- 호스트 포트 스캔은 제한적 기능으로 표시
- 필요시 호스트에 별도 에이전트 배포 고려 (향후 확장)

### 2. 프로세스 정보 표시 권한

**What we know:**
- `ss -p` 옵션은 root 권한 필요
- Docker 컨테이너는 기본적으로 non-root로 실행

**What's unclear:**
- 프로세스 정보 없이도 사용자 경험이 충분한지

**Recommendation:**
- 프로세스 정보는 "available when possible"로 처리
- Docker 컨테이너는 컨테이너명으로 대체 (더 유용함)

## Sources

### Primary (HIGH confidence)

- [ss(8) - Linux manual page](https://man7.org/linux/man-pages/man8/ss.8.html) - ss 명령어 옵션 및 출력 형식
- [Docker API Reference](https://docs.docker.com/reference/cli/docker/container/port/) - 컨테이너 포트 조회
- 기존 `src/lib/docker.ts` - 프로젝트 Docker API 클라이언트
- 기존 `src/lib/system.ts` - 시스템 명령어 실행 패턴
- 기존 `src/lib/port-service.ts` - PortRegistry 서비스

### Secondary (MEDIUM confidence)

- [Node.js portscanner](https://github.com/baalexander/node-portscanner) - TCP 포트 스캔 라이브러리
- [Baeldung - Docker List Open Sockets](https://www.baeldung.com/linux/docker-list-open-sockets-inside-container) - Docker 컨테이너 네트워크 접근
- [dockerode GitHub](https://github.com/apocas/dockerode) - Node.js Docker API (참고용)

### Tertiary (LOW confidence)

- WebSearch: Docker host network mode 관련 블로그 포스트 - 구체적 구현 검증 필요

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 기존 프로젝트 패턴 그대로 활용
- Architecture: HIGH - 기존 docker.ts, system.ts 패턴 확장
- Pitfalls: HIGH - Docker 네트워크 격리는 문서화된 동작

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - 안정적인 도메인)
