import { describe, it, expect } from 'vitest';
import {
  parseProcStat,
  calculateCpuPercent,
  parseProcMeminfo,
  parseNetDev,
  parseProcessList,
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

describe('parseNetDev', () => {
  it('should parse valid /proc/net/dev content', () => {
    const content = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 12345678   98765    0    0    0     0          0         0 12345678   98765    0    0    0     0       0          0
  eth0: 987654321 123456    0    0    0     0          0         0 123456789  654321    0    0    0     0       0          0`;
    const result = parseNetDev(content);
    expect(result).toEqual([
      {
        name: 'lo',
        rxBytes: 12345678,
        rxPackets: 98765,
        txBytes: 12345678,
        txPackets: 98765,
      },
      {
        name: 'eth0',
        rxBytes: 987654321,
        rxPackets: 123456,
        txBytes: 123456789,
        txPackets: 654321,
      },
    ]);
  });

  it('should return empty array for empty input', () => {
    expect(parseNetDev('')).toEqual([]);
  });

  it('should return empty array for null/undefined input', () => {
    expect(parseNetDev(null as unknown as string)).toEqual([]);
    expect(parseNetDev(undefined as unknown as string)).toEqual([]);
  });

  it('should return empty array for header-only input', () => {
    const content = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed`;
    expect(parseNetDev(content)).toEqual([]);
  });

  it('should handle interface names with spaces', () => {
    const content = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
enp0s3: 1000 100 0 0 0 0 0 0 2000 200 0 0 0 0 0 0`;
    const result = parseNetDev(content);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('enp0s3');
  });

  it('should handle real-world /proc/net/dev format', () => {
    const content = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:  116232     980    0    0    0     0          0         0   116232     980    0    0    0     0       0          0
enp3s0: 1634560864 1239450    0    0    0     0          0     14921 62945398  550188    0    0    0     0       0          0
docker0:       0       0    0    0    0     0          0         0        0       0    0    0    0     0       0          0`;
    const result = parseNetDev(content);
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({
      name: 'enp3s0',
      rxBytes: 1634560864,
      rxPackets: 1239450,
      txBytes: 62945398,
      txPackets: 550188,
    });
  });

  it('should skip invalid lines', () => {
    const content = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 1000 100 0 0 0 0 0 0 2000 200 0 0 0 0 0 0
invalid line without colon
  eth0: 3000 300 0 0 0 0 0 0 4000 400 0 0 0 0 0 0`;
    const result = parseNetDev(content);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('lo');
    expect(result[1].name).toBe('eth0');
  });
});

describe('parseProcessList', () => {
  it('should parse valid ps aux output', () => {
    const output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.1 169368 11480 ?        Ss   Jan13   0:06 /sbin/init
www-data    1234 25.5 12.3 987654 123456 ?      Sl   10:30   5:23 /usr/bin/node server.js
postgres    5678  5.2  8.7 654321 87654 ?       Ss   09:00   2:15 postgres: main process`;
    const result = parseProcessList(output);
    expect(result).toEqual([
      { pid: 1, name: '/sbin/init', cpu: 0.0, memory: 0.1 },
      { pid: 1234, name: '/usr/bin/node server.js', cpu: 25.5, memory: 12.3 },
      { pid: 5678, name: 'postgres: main process', cpu: 5.2, memory: 8.7 },
    ]);
  });

  it('should return empty array for empty input', () => {
    expect(parseProcessList('')).toEqual([]);
  });

  it('should return empty array for null/undefined input', () => {
    expect(parseProcessList(null as unknown as string)).toEqual([]);
    expect(parseProcessList(undefined as unknown as string)).toEqual([]);
  });

  it('should return empty array for header-only input', () => {
    const output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND`;
    expect(parseProcessList(output)).toEqual([]);
  });

  it('should handle commands with multiple spaces', () => {
    const output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
user         100  1.0  2.0 10000  1000 pts/0    R+   10:00   0:01 python script.py --arg1 value1 --arg2 value2`;
    const result = parseProcessList(output);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('python script.py --arg1 value1 --arg2 value2');
  });

  it('should skip lines with insufficient columns', () => {
    const output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.1 169368
user         100  1.0  2.0 10000  1000 pts/0    R+   10:00   0:01 valid_process`;
    const result = parseProcessList(output);
    expect(result).toHaveLength(1);
    expect(result[0].pid).toBe(100);
  });

  it('should handle floating point CPU and memory values', () => {
    const output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
user         999 99.9 50.5 10000  1000 pts/0    R+   10:00   0:01 heavy_process`;
    const result = parseProcessList(output);
    expect(result[0].cpu).toBe(99.9);
    expect(result[0].memory).toBe(50.5);
  });

  it('should handle real-world ps aux output', () => {
    const output = `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0 167532 11884 ?        Ss   Jan13   0:07 /sbin/init splash
root           2  0.0  0.0      0     0 ?        S    Jan13   0:00 [kthreadd]
root           3  0.0  0.0      0     0 ?        I<   Jan13   0:00 [rcu_gp]
gon        12345 15.3  5.2 1234567 543210 ?     Sl   10:00  25:30 /usr/bin/code --unity-launch
mysql      67890  2.1  3.4 2345678 345678 ?     Ssl  09:00  10:15 /usr/sbin/mysqld`;
    const result = parseProcessList(output);
    expect(result).toHaveLength(5);
    expect(result[3]).toEqual({
      pid: 12345,
      name: '/usr/bin/code --unity-launch',
      cpu: 15.3,
      memory: 5.2,
    });
  });
});
