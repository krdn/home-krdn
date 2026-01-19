/**
 * Port Scanner Service
 * 시스템 포트 스캔 및 비교 서비스
 *
 * Phase 43: Port Scanner & Guide
 * - 시스템 포트 스캔 (ss 명령어)
 * - Docker 포트 바인딩 조회
 * - PortRegistry와 비교
 */

import { execSync } from 'child_process'
import type {
  SystemPort,
  DockerPortBinding,
  PortComparisonResult,
  PortScanResult,
  ScanProtocol,
} from '@/types/port-scanner'
import { listContainers } from '@/lib/docker'
import { getAllPorts } from '@/lib/port-service'

// ============================================================
// ss 출력 파싱 (순수 함수)
// ============================================================

/**
 * ss -tlnH 출력을 파싱합니다.
 * LISTEN 상태인 TCP 포트만 추출합니다.
 *
 * ss 출력 형식 예시:
 * LISTEN 0 128 0.0.0.0:3000 0.0.0.0:* users:(("node",pid=1234,fd=20))
 * LISTEN 0 128 [::]:8080 [::]:* users:(("java",pid=5678,fd=30))
 *
 * @param output ss 명령어 출력
 * @returns 파싱된 SystemPort 배열
 */
export function parseSsOutput(output: string): SystemPort[] {
  if (!output || typeof output !== 'string') {
    return []
  }

  const ports: SystemPort[] = []
  const lines = output.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    try {
      // ss 출력 형식: State Recv-Q Send-Q Local-Addr:Port Peer-Addr:Port Process
      // 예: LISTEN 0 128 0.0.0.0:3000 0.0.0.0:* users:(("node",pid=1234,fd=20))
      const parts = trimmedLine.split(/\s+/)

      // 최소 4개의 필드 필요 (State, Recv-Q, Send-Q, Local-Addr)
      if (parts.length < 4) continue

      const state = parts[0]
      // LISTEN 상태만 추출
      if (state !== 'LISTEN') continue

      const localAddr = parts[3]
      if (!localAddr) continue

      // Local-Addr 파싱 (IPv4: 0.0.0.0:3000, IPv6: [::]:3000 또는 *:3000)
      const { address, port } = parseLocalAddress(localAddr)
      if (!port) continue

      // 프로세스 정보 파싱 (있는 경우)
      const processInfo = extractProcessInfo(parts.slice(5).join(' '))

      ports.push({
        port,
        protocol: 'tcp' as ScanProtocol,
        state: 'LISTEN',
        address,
        ...(processInfo.process && { process: processInfo.process }),
        ...(processInfo.pid && { pid: processInfo.pid }),
      })
    } catch {
      // 파싱 실패 시 해당 라인 무시
      continue
    }
  }

  // 중복 포트 제거 (같은 포트가 IPv4, IPv6에서 모두 리스닝할 수 있음)
  const uniquePorts = new Map<number, SystemPort>()
  for (const port of ports) {
    // 0.0.0.0 (모든 인터페이스)가 우선
    const existing = uniquePorts.get(port.port)
    if (!existing || port.address === '0.0.0.0' || port.address === '::') {
      uniquePorts.set(port.port, port)
    }
  }

  return Array.from(uniquePorts.values()).sort((a, b) => a.port - b.port)
}

/**
 * Local Address를 파싱합니다.
 * IPv4: 0.0.0.0:3000, 127.0.0.1:8080
 * IPv6: [::]:3000, [::1]:8080, *:3000
 *
 * @param localAddr Local Address 문자열
 * @returns 주소와 포트 번호
 */
function parseLocalAddress(localAddr: string): { address?: string; port?: number } {
  // IPv6: [::]:port 또는 [::1]:port
  const ipv6Match = localAddr.match(/^\[([^\]]*)\]:(\d+)$/)
  if (ipv6Match) {
    return {
      address: ipv6Match[1] || '::',
      port: parseInt(ipv6Match[2], 10),
    }
  }

  // 와일드카드: *:port
  if (localAddr.startsWith('*:')) {
    const port = parseInt(localAddr.slice(2), 10)
    return { address: '0.0.0.0', port }
  }

  // IPv4: address:port
  const lastColonIndex = localAddr.lastIndexOf(':')
  if (lastColonIndex === -1) {
    return {}
  }

  const address = localAddr.slice(0, lastColonIndex)
  const portStr = localAddr.slice(lastColonIndex + 1)
  const port = parseInt(portStr, 10)

  if (isNaN(port) || port < 1 || port > 65535) {
    return {}
  }

  return { address, port }
}

/**
 * 프로세스 정보를 추출합니다.
 * users:(("node",pid=1234,fd=20)) 형식에서 프로세스 이름과 PID 추출
 *
 * @param info 프로세스 정보 문자열
 * @returns 프로세스 이름과 PID
 */
function extractProcessInfo(info: string): { process?: string; pid?: number } {
  if (!info) return {}

  // users:(("node",pid=1234,fd=20)) 패턴
  const match = info.match(/users:\(\("([^"]+)".*pid=(\d+)/)
  if (match) {
    return {
      process: match[1],
      pid: parseInt(match[2], 10),
    }
  }

  return {}
}

// ============================================================
// 시스템 포트 스캔
// ============================================================

/**
 * 시스템에서 열린 TCP 포트를 스캔합니다.
 * 컨테이너 내부에서 실행 시 컨테이너 네임스페이스 포트만 표시됩니다.
 *
 * @returns SystemPort 배열
 */
export async function scanSystemPorts(): Promise<SystemPort[]> {
  try {
    // ss 명령어 우선, 실패 시 netstat 사용
    // -t: TCP만, -l: LISTEN 상태만, -n: 숫자로 표시, -H: 헤더 제거
    const output = execSync('ss -tlnH 2>/dev/null || netstat -tlnp 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 5000, // 5초 타임아웃
    })

    return parseSsOutput(output)
  } catch (error) {
    console.warn('[PortScanner] 시스템 포트 스캔 실패:', error)
    return []
  }
}

// ============================================================
// Docker 포트 바인딩 조회
// ============================================================

/**
 * 모든 Docker 컨테이너의 호스트 포트 바인딩을 조회합니다.
 *
 * @returns DockerPortBinding 배열
 */
export async function getDockerPortBindings(): Promise<DockerPortBinding[]> {
  try {
    // 모든 컨테이너 조회 (정지된 컨테이너 포함)
    const containers = await listContainers(true)
    const bindings: DockerPortBinding[] = []

    for (const container of containers) {
      // 컨테이너의 ports 배열에서 바인딩 정보 추출
      // 형식: "hostPort:containerPort/protocol"
      for (const portStr of container.ports) {
        const binding = parseDockerPortString(portStr, container)
        if (binding) {
          bindings.push(binding)
        }
      }
    }

    return bindings.sort((a, b) => a.hostPort - b.hostPort)
  } catch (error) {
    console.warn('[PortScanner] Docker 포트 바인딩 조회 실패:', error)
    return []
  }
}

/**
 * Docker 포트 문자열을 파싱합니다.
 * 형식: "hostPort:containerPort/protocol" (예: "3000:3000/tcp")
 *
 * @param portStr 포트 문자열
 * @param container 컨테이너 정보
 * @returns DockerPortBinding 또는 null
 */
function parseDockerPortString(
  portStr: string,
  container: { id: string; name: string; state: string }
): DockerPortBinding | null {
  // 형식: "3000:3000/tcp" 또는 "8080:80/tcp"
  const match = portStr.match(/^(\d+):(\d+)\/(\w+)$/)
  if (!match) return null

  const [, hostPortStr, containerPortStr, protocol] = match
  const hostPort = parseInt(hostPortStr, 10)
  const containerPort = parseInt(containerPortStr, 10)

  if (isNaN(hostPort) || isNaN(containerPort)) return null

  return {
    hostPort,
    containerPort,
    protocol,
    containerId: container.id,
    containerName: container.name,
    containerState: container.state,
  }
}

// ============================================================
// Registry와 비교
// ============================================================

/**
 * PortRegistry에 등록된 포트와 실제 활성 포트를 비교합니다.
 *
 * 분류:
 * - registeredAndActive: 등록됨 + Docker에서 활성
 * - registeredButInactive: 등록됨 + Docker에 없음
 * - unregisteredButActive: 미등록 + Docker에서 활성
 *
 * @returns PortComparisonResult
 */
export async function comparePortsWithRegistry(): Promise<PortComparisonResult> {
  // 1. 데이터 조회
  const [registeredPorts, dockerBindings, systemPorts] = await Promise.all([
    getAllPorts(),
    getDockerPortBindings(),
    scanSystemPorts(),
  ])

  // 2. Docker 포트를 Map으로 변환 (hostPort 기준)
  const dockerPortMap = new Map<number, DockerPortBinding>()
  for (const binding of dockerBindings) {
    dockerPortMap.set(binding.hostPort, binding)
  }

  // 3. 시스템 포트를 Map으로 변환
  const systemPortMap = new Map<number, SystemPort>()
  for (const port of systemPorts) {
    systemPortMap.set(port.port, port)
  }

  // 4. 비교 결과 분류
  const registeredAndActive: PortComparisonResult['registeredAndActive'] = []
  const registeredButInactive: PortComparisonResult['registeredButInactive'] = []
  const unregisteredPorts = new Set<number>()

  // 등록된 포트 순회
  for (const registered of registeredPorts) {
    const docker = dockerPortMap.get(registered.port)

    if (docker) {
      // 등록됨 + Docker에서 활성
      registeredAndActive.push({ registered, docker })
    } else {
      // 등록됨 + Docker에 없음
      registeredButInactive.push(registered)
    }
  }

  // 등록된 포트 번호 Set
  const registeredPortNumbers = new Set(registeredPorts.map((p) => p.port))

  // 미등록 활성 포트 찾기
  const unregisteredButActive: PortComparisonResult['unregisteredButActive'] = []
  for (const [port, docker] of dockerPortMap) {
    if (!registeredPortNumbers.has(port)) {
      unregisteredPorts.add(port)
      unregisteredButActive.push({
        docker,
        system: systemPortMap.get(port),
      })
    }
  }

  // 5. 요약 통계
  const summary = {
    totalRegistered: registeredPorts.length,
    activeCount: registeredAndActive.length,
    inactiveCount: registeredButInactive.length,
    unregisteredCount: unregisteredButActive.length,
  }

  return {
    registeredAndActive,
    registeredButInactive,
    unregisteredButActive,
    summary,
  }
}

// ============================================================
// 포트 스캔 결과 조회
// ============================================================

/**
 * 시스템과 Docker의 포트 스캔 결과를 통합하여 반환합니다.
 *
 * @returns PortScanResult
 */
export async function getPortScanResult(): Promise<PortScanResult> {
  const [system, docker] = await Promise.all([
    scanSystemPorts(),
    getDockerPortBindings(),
  ])

  return {
    system,
    docker,
    scannedAt: new Date().toISOString(),
  }
}
