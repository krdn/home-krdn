/**
 * System Metrics Library
 * 시스템 CPU, 메모리, 디스크 사용량을 가져옵니다.
 */

import { execSync } from 'child_process';
import * as os from 'os';
import { formatUptime } from './utils';

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
