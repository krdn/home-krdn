import { describe, it, expect } from 'vitest';
import { cn, formatBytes, formatUptime, getStatusColor } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('formatBytes', () => {
  it('should return "0 Bytes" for 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
  });

  it('should format KB correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('should format MB correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });

  it('should format GB correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should format TB correctly', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB');
  });

  it('should respect decimals parameter', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });

  it('should handle negative decimals as 0', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB');
    expect(formatBytes(1536, -5)).toBe('2 KB');
  });
});

describe('formatUptime', () => {
  it('should format seconds under 1 minute', () => {
    expect(formatUptime(0)).toBe('0m');
    expect(formatUptime(30)).toBe('0m');
    expect(formatUptime(59)).toBe('0m');
  });

  it('should format minutes correctly', () => {
    expect(formatUptime(60)).toBe('1m');
    expect(formatUptime(120)).toBe('2m');
    expect(formatUptime(3599)).toBe('59m');
  });

  it('should format hours correctly', () => {
    expect(formatUptime(3600)).toBe('1h 0m');
    expect(formatUptime(7200)).toBe('2h 0m');
    expect(formatUptime(3660)).toBe('1h 1m');
  });

  it('should format days correctly', () => {
    expect(formatUptime(86400)).toBe('1d 0h');
    expect(formatUptime(172800)).toBe('2d 0h');
  });

  it('should format complex uptime correctly', () => {
    // 1d 1h 1m 1s = 86400 + 3600 + 60 + 1 = 90061
    expect(formatUptime(90061)).toBe('1d 1h');
    // 2d 3h 45m = 172800 + 10800 + 2700 = 186300
    expect(formatUptime(186300)).toBe('2d 3h');
  });
});

describe('getStatusColor', () => {
  describe('success states', () => {
    it('should return text-success for "running"', () => {
      expect(getStatusColor('running')).toBe('text-success');
    });

    it('should return text-success for "healthy"', () => {
      expect(getStatusColor('healthy')).toBe('text-success');
    });

    it('should return text-success for "up"', () => {
      expect(getStatusColor('up')).toBe('text-success');
    });
  });

  describe('stopped states', () => {
    it('should return text-muted-foreground for "stopped"', () => {
      expect(getStatusColor('stopped')).toBe('text-muted-foreground');
    });

    it('should return text-muted-foreground for "exited"', () => {
      expect(getStatusColor('exited')).toBe('text-muted-foreground');
    });
  });

  describe('warning states', () => {
    it('should return text-warning for "starting"', () => {
      expect(getStatusColor('starting')).toBe('text-warning');
    });

    it('should return text-warning for "restarting"', () => {
      expect(getStatusColor('restarting')).toBe('text-warning');
    });
  });

  describe('error states', () => {
    it('should return text-destructive for "error"', () => {
      expect(getStatusColor('error')).toBe('text-destructive');
    });

    it('should return text-destructive for "unhealthy"', () => {
      expect(getStatusColor('unhealthy')).toBe('text-destructive');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase', () => {
      expect(getStatusColor('RUNNING')).toBe('text-success');
      expect(getStatusColor('STOPPED')).toBe('text-muted-foreground');
      expect(getStatusColor('ERROR')).toBe('text-destructive');
    });

    it('should handle mixed case', () => {
      expect(getStatusColor('Running')).toBe('text-success');
      expect(getStatusColor('Healthy')).toBe('text-success');
      expect(getStatusColor('Starting')).toBe('text-warning');
    });
  });

  describe('unknown states', () => {
    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('text-muted-foreground');
      expect(getStatusColor('pending')).toBe('text-muted-foreground');
      expect(getStatusColor('')).toBe('text-muted-foreground');
    });
  });
});
