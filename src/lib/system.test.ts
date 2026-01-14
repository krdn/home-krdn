import { describe, it, expect } from 'vitest';
import {
  parseProcStat,
  calculateCpuPercent,
  parseProcMeminfo,
  type CpuStatValues,
} from './system';

describe('parseProcStat', () => {
  it('should parse valid /proc/stat content', () => {
    const content = `cpu  100 200 300 400 50 60 70 0 0 0
cpu0 50 100 150 200 25 30 35 0 0 0
`;
    const result = parseProcStat(content);
    expect(result).toEqual({
      user: 100,
      nice: 200,
      system: 300,
      idle: 400,
      iowait: 50,
      irq: 60,
      softirq: 70,
    });
  });

  it('should return null for empty input', () => {
    expect(parseProcStat('')).toBeNull();
  });

  it('should return null for null/undefined input', () => {
    expect(parseProcStat(null as unknown as string)).toBeNull();
    expect(parseProcStat(undefined as unknown as string)).toBeNull();
  });

  it('should return null for invalid format (no cpu line)', () => {
    const content = `something else
another line`;
    expect(parseProcStat(content)).toBeNull();
  });

  it('should return null for invalid format (insufficient values)', () => {
    const content = `cpu  100 200 300`;
    expect(parseProcStat(content)).toBeNull();
  });

  it('should return null for non-numeric values', () => {
    const content = `cpu  100 abc 300 400 50 60 70`;
    expect(parseProcStat(content)).toBeNull();
  });

  it('should handle real-world /proc/stat format', () => {
    // 실제 Linux /proc/stat 형식 예시
    const content = `cpu  2255 34 2290 22625563 6290 127 456 0 0 0
cpu0 1132 34 1441 11311718 3675 127 438 0 0 0
cpu1 1123 0 849 11313845 2614 0 18 0 0 0
intr 114930548 113 0 0 0 0 0 0 0 1 79 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
ctxt 38014093
btime 1051290899
processes 26442
procs_running 1
procs_blocked 0`;
    const result = parseProcStat(content);
    expect(result).toEqual({
      user: 2255,
      nice: 34,
      system: 2290,
      idle: 22625563,
      iowait: 6290,
      irq: 127,
      softirq: 456,
    });
  });
});

describe('calculateCpuPercent', () => {
  it('should return 0 for idle system', () => {
    const stats: CpuStatValues = {
      user: 0,
      nice: 0,
      system: 0,
      idle: 1000,
      iowait: 0,
      irq: 0,
      softirq: 0,
    };
    expect(calculateCpuPercent(stats)).toBe(0);
  });

  it('should return 100 for fully loaded system', () => {
    const stats: CpuStatValues = {
      user: 500,
      nice: 200,
      system: 300,
      idle: 0,
      iowait: 0,
      irq: 0,
      softirq: 0,
    };
    expect(calculateCpuPercent(stats)).toBe(100);
  });

  it('should calculate 50% usage correctly', () => {
    const stats: CpuStatValues = {
      user: 250,
      nice: 0,
      system: 250,
      idle: 500,
      iowait: 0,
      irq: 0,
      softirq: 0,
    };
    expect(calculateCpuPercent(stats)).toBe(50);
  });

  it('should calculate typical usage correctly', () => {
    // 총 1000, active = 300 (user 100 + system 200), idle + iowait = 700
    const stats: CpuStatValues = {
      user: 100,
      nice: 0,
      system: 200,
      idle: 600,
      iowait: 100,
      irq: 0,
      softirq: 0,
    };
    expect(calculateCpuPercent(stats)).toBe(30);
  });

  it('should handle iowait as idle time', () => {
    // iowait는 idle 시간으로 계산됨
    const stats: CpuStatValues = {
      user: 200,
      nice: 0,
      system: 100,
      idle: 500,
      iowait: 200,
      irq: 0,
      softirq: 0,
    };
    // total = 1000, active = 300, idle + iowait = 700
    expect(calculateCpuPercent(stats)).toBe(30);
  });

  it('should return 0 when total is 0', () => {
    const stats: CpuStatValues = {
      user: 0,
      nice: 0,
      system: 0,
      idle: 0,
      iowait: 0,
      irq: 0,
      softirq: 0,
    };
    expect(calculateCpuPercent(stats)).toBe(0);
  });

  it('should round to nearest integer', () => {
    // total = 1000, active = 333
    const stats: CpuStatValues = {
      user: 333,
      nice: 0,
      system: 0,
      idle: 667,
      iowait: 0,
      irq: 0,
      softirq: 0,
    };
    expect(calculateCpuPercent(stats)).toBe(33);
  });
});

describe('parseProcMeminfo', () => {
  it('should parse valid /proc/meminfo content', () => {
    const content = `MemTotal:       16384000 kB
MemFree:         8192000 kB
MemAvailable:   12288000 kB
Buffers:          512000 kB
Cached:          2048000 kB`;
    const result = parseProcMeminfo(content);
    expect(result).toEqual({
      memTotal: 16384000 * 1024,
      memFree: 8192000 * 1024,
      memAvailable: 12288000 * 1024,
    });
  });

  it('should return null for empty input', () => {
    expect(parseProcMeminfo('')).toBeNull();
  });

  it('should return null for null/undefined input', () => {
    expect(parseProcMeminfo(null as unknown as string)).toBeNull();
    expect(parseProcMeminfo(undefined as unknown as string)).toBeNull();
  });

  it('should return null when MemTotal is missing', () => {
    const content = `MemFree:         8192000 kB
MemAvailable:   12288000 kB`;
    expect(parseProcMeminfo(content)).toBeNull();
  });

  it('should return null when MemFree is missing', () => {
    const content = `MemTotal:       16384000 kB
MemAvailable:   12288000 kB`;
    expect(parseProcMeminfo(content)).toBeNull();
  });

  it('should use MemFree as fallback when MemAvailable is missing', () => {
    const content = `MemTotal:       16384000 kB
MemFree:         8192000 kB
Buffers:          512000 kB`;
    const result = parseProcMeminfo(content);
    expect(result).toEqual({
      memTotal: 16384000 * 1024,
      memFree: 8192000 * 1024,
      memAvailable: 8192000 * 1024, // MemFree와 동일
    });
  });

  it('should handle real-world /proc/meminfo format', () => {
    const content = `MemTotal:       32902804 kB
MemFree:          282416 kB
MemAvailable:   12685480 kB
Buffers:          987520 kB
Cached:         11736844 kB
SwapCached:       123456 kB
Active:         10234567 kB
Inactive:        8765432 kB
Active(anon):    5432109 kB
Inactive(anon):   543210 kB
Active(file):    4802458 kB
Inactive(file):  8222222 kB
Unevictable:          64 kB
Mlocked:              64 kB
SwapTotal:       8388604 kB
SwapFree:        7654321 kB
Dirty:             12345 kB
Writeback:             0 kB
AnonPages:       4567890 kB
Mapped:           567890 kB
Shmem:           1234567 kB`;
    const result = parseProcMeminfo(content);
    expect(result).toEqual({
      memTotal: 32902804 * 1024,
      memFree: 282416 * 1024,
      memAvailable: 12685480 * 1024,
    });
  });

  it('should correctly convert KB to bytes', () => {
    const content = `MemTotal:       1024 kB
MemFree:         512 kB
MemAvailable:    768 kB`;
    const result = parseProcMeminfo(content);
    expect(result).toEqual({
      memTotal: 1048576,     // 1024 * 1024
      memFree: 524288,       // 512 * 1024
      memAvailable: 786432,  // 768 * 1024
    });
  });

  it('should ignore non-memory lines', () => {
    const content = `SomeOther:        12345 kB
MemTotal:       16384000 kB
RandomEntry:      98765 kB
MemFree:         8192000 kB
AnotherOne:       54321 kB
MemAvailable:   12288000 kB`;
    const result = parseProcMeminfo(content);
    expect(result).toEqual({
      memTotal: 16384000 * 1024,
      memFree: 8192000 * 1024,
      memAvailable: 12288000 * 1024,
    });
  });
});
