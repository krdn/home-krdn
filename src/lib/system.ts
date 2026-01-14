/**
 * System Metrics Library
 * 시스템 CPU, 메모리, 디스크 사용량을 가져옵니다.
 */

import { execSync } from 'child_process';
import * as os from 'os';
import { formatUptime } from './utils';

// ==========================================
// 순수 함수들 (테스트 가능)
// ==========================================

/**
 * /proc/stat CPU 라인 파싱 결과 타입
 */
export interface CpuStatValues {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
}

/**
 * /proc/stat 내용을 파싱합니다. (순수 함수)
 * @param content /proc/stat 파일 내용
 * @returns 파싱된 CPU 값들 또는 null
 */
export function parseProcStat(content: string): CpuStatValues | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const lines = content.split('\n');
  const cpuLine = lines.find(line => line.startsWith('cpu '));

  if (!cpuLine) {
    return null;
  }

  const values = cpuLine.split(/\s+/).slice(1, 8).map(Number);

  if (values.length < 7 || values.some(isNaN)) {
    return null;
  }

  const [user, nice, system, idle, iowait, irq, softirq] = values;

  return { user, nice, system, idle, iowait, irq, softirq };
}

/**
 * CPU 사용률을 계산합니다. (순수 함수)
 * @param stats CpuStatValues 객체
 * @returns CPU 사용률 (0-100)
 */
export function calculateCpuPercent(stats: CpuStatValues): number {
  const { user, nice, system, idle, iowait, irq, softirq } = stats;
  const total = user + nice + system + idle + iowait + irq + softirq;

  if (total === 0) {
    return 0;
  }

  const active = total - idle - iowait;
  return Math.round((active / total) * 100);
}

/**
 * /proc/meminfo 파싱 결과 타입
 */
export interface MeminfoValues {
  memTotal: number;      // bytes
  memFree: number;       // bytes
  memAvailable: number;  // bytes
}

/**
 * /proc/meminfo 내용을 파싱합니다. (순수 함수)
 * @param content /proc/meminfo 파일 내용
 * @returns 파싱된 메모리 값들 또는 null
 */
export function parseProcMeminfo(content: string): MeminfoValues | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const lines = content.split('\n');
  const values: Partial<MeminfoValues> = {};

  for (const line of lines) {
    const match = line.match(/^(\w+):\s+(\d+)\s+kB/);
    if (match) {
      const [, key, value] = match;
      const bytes = parseInt(value, 10) * 1024; // KB -> bytes

      switch (key) {
        case 'MemTotal':
          values.memTotal = bytes;
          break;
        case 'MemFree':
          values.memFree = bytes;
          break;
        case 'MemAvailable':
          values.memAvailable = bytes;
          break;
      }
    }
  }

  if (values.memTotal === undefined || values.memFree === undefined) {
    return null;
  }

  return {
    memTotal: values.memTotal,
    memFree: values.memFree,
    memAvailable: values.memAvailable ?? values.memFree, // memAvailable이 없으면 memFree 사용
  };
}

// ==========================================
// 네트워크 메트릭 타입 및 함수
// ==========================================

/**
 * 네트워크 인터페이스 정보 타입
 */
export interface NetworkInterface {
  name: string;
  rxBytes: number;     // 수신 바이트
  txBytes: number;     // 송신 바이트
  rxPackets: number;   // 수신 패킷 수
  txPackets: number;   // 송신 패킷 수
}

/**
 * /proc/net/dev 내용을 파싱합니다. (순수 함수)
 * @param content /proc/net/dev 파일 내용
 * @returns 파싱된 네트워크 인터페이스 목록
 */
export function parseNetDev(content: string): NetworkInterface[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const lines = content.split('\n');
  const interfaces: NetworkInterface[] = [];

  // 처음 2줄은 헤더이므로 skip
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 형식: "interface: rx_bytes rx_packets ... tx_bytes tx_packets ..."
    const match = line.match(/^([^:]+):\s*(\d+)\s+(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+(\d+)/);
    if (match) {
      const [, name, rxBytes, rxPackets, txBytes, txPackets] = match;
      interfaces.push({
        name: name.trim(),
        rxBytes: parseInt(rxBytes, 10),
        rxPackets: parseInt(rxPackets, 10),
        txBytes: parseInt(txBytes, 10),
        txPackets: parseInt(txPackets, 10),
      });
    }
  }

  return interfaces;
}

/**
 * 네트워크 인터페이스 정보를 가져옵니다.
 */
function getNetworkInfo(): NetworkInterface[] {
  try {
    const content = execSync('cat /proc/net/dev').toString();
    return parseNetDev(content);
  } catch {
    return [];
  }
}

// ==========================================
// 프로세스 메트릭 타입 및 함수
// ==========================================

/**
 * 프로세스 정보 타입
 */
export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;     // CPU 사용률 (%)
  memory: number;  // 메모리 사용률 (%)
}

/**
 * ps aux 출력을 파싱합니다. (순수 함수)
 * @param output ps aux --sort 명령의 출력
 * @returns 파싱된 프로세스 목록
 */
export function parseProcessList(output: string): ProcessInfo[] {
  if (!output || typeof output !== 'string') {
    return [];
  }

  const lines = output.split('\n');
  const processes: ProcessInfo[] = [];

  // 첫 줄은 헤더이므로 skip
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // ps aux 형식: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
    const parts = line.split(/\s+/);
    if (parts.length < 11) continue;

    const pid = parseInt(parts[1], 10);
    const cpu = parseFloat(parts[2]);
    const memory = parseFloat(parts[3]);
    // COMMAND는 공백을 포함할 수 있으므로 나머지 전체를 합침
    const name = parts.slice(10).join(' ');

    if (isNaN(pid) || isNaN(cpu) || isNaN(memory)) continue;

    processes.push({
      pid,
      name,
      cpu,
      memory,
    });
  }

  return processes;
}

/**
 * 상위 프로세스 정보를 가져옵니다 (CPU 사용량 기준).
 * @param limit 가져올 프로세스 수 (기본값: 5)
 */
function getTopProcesses(limit: number = 5): ProcessInfo[] {
  try {
    // CPU 사용률 기준으로 정렬된 프로세스 목록 가져오기
    const output = execSync(`ps aux --sort=-%cpu | head -${limit + 1}`).toString();
    return parseProcessList(output).slice(0, limit);
  } catch {
    return [];
  }
}

// ==========================================
// 타입 정의
// ==========================================

export interface SystemMetrics {
  cpu: {
    usage: number;        // 0-100
    cores: number;
    model: string;
    loadAvg: number[];    // 1분, 5분, 15분
  };
  memory: {
    total: number;        // bytes
    used: number;         // bytes
    free: number;         // bytes
    usage: number;        // 0-100
  };
  disk: {
    total: number;        // bytes
    used: number;         // bytes
    free: number;         // bytes
    usage: number;        // 0-100
    path: string;
  };
  network: NetworkInterface[];  // 네트워크 인터페이스 목록
  processes: ProcessInfo[];     // 상위 프로세스 목록
  uptime: number;         // seconds
  hostname: string;
  platform: string;
}

/**
 * CPU 사용률을 계산합니다.
 */
function getCpuUsage(): number {
  try {
    // Linux: /proc/stat에서 CPU 사용률 계산
    const stat = execSync('cat /proc/stat | head -1').toString();
    const values = stat.split(/\s+/).slice(1, 8).map(Number);
    const [user, nice, system, idle, iowait, irq, softirq] = values;

    const total = user + nice + system + idle + iowait + irq + softirq;
    const active = total - idle - iowait;

    return Math.round((active / total) * 100);
  } catch {
    // 대체: os.loadavg() 사용
    const loadAvg = os.loadavg()[0];
    const cpus = os.cpus().length;
    return Math.min(100, Math.round((loadAvg / cpus) * 100));
  }
}

/**
 * 메모리 사용량을 가져옵니다.
 */
function getMemoryInfo(): SystemMetrics['memory'] {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total,
    used,
    free,
    usage: Math.round((used / total) * 100),
  };
}

/**
 * 디스크 사용량을 가져옵니다.
 */
function getDiskInfo(path: string = '/'): SystemMetrics['disk'] {
  try {
    const output = execSync(`df -B1 ${path} | tail -1`).toString();
    const parts = output.split(/\s+/);

    const total = parseInt(parts[1], 10);
    const used = parseInt(parts[2], 10);
    const free = parseInt(parts[3], 10);

    return {
      total,
      used,
      free,
      usage: Math.round((used / total) * 100),
      path,
    };
  } catch {
    return {
      total: 0,
      used: 0,
      free: 0,
      usage: 0,
      path,
    };
  }
}

/**
 * CPU 모델 정보를 가져옵니다.
 */
function getCpuModel(): string {
  const cpus = os.cpus();
  return cpus[0]?.model || 'Unknown';
}

/**
 * 전체 시스템 메트릭을 가져옵니다.
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  return {
    cpu: {
      usage: getCpuUsage(),
      cores: os.cpus().length,
      model: getCpuModel(),
      loadAvg: os.loadavg(),
    },
    memory: getMemoryInfo(),
    disk: getDiskInfo('/'),
    network: getNetworkInfo(),
    processes: getTopProcesses(5),
    uptime: os.uptime(),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
  };
}

/**
 * 간단한 시스템 상태를 가져옵니다.
 */
export async function getQuickStats(): Promise<{
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
}> {
  const metrics = await getSystemMetrics();

  return {
    cpuUsage: metrics.cpu.usage,
    memoryUsage: metrics.memory.usage,
    diskUsage: metrics.disk.usage,
    uptime: formatUptime(metrics.uptime),
  };
}
