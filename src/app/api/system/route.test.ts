/**
 * System API Route 테스트
 * GET /api/system - 시스템 메트릭 반환
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// system.ts 모듈 mocking
vi.mock('@/lib/system', () => ({
  getSystemMetrics: vi.fn(),
}));

// utils.ts 모듈 mocking (formatBytes, formatUptime)
vi.mock('@/lib/utils', () => ({
  formatBytes: vi.fn((bytes: number) => `${bytes} Bytes`),
  formatUptime: vi.fn((seconds: number) => `${seconds}s`),
}));

import { getSystemMetrics } from '@/lib/system';

const mockGetSystemMetrics = vi.mocked(getSystemMetrics);

// Mock 시스템 메트릭 데이터
const mockSystemMetrics = {
  cpu: {
    usage: 45,
    cores: 8,
    model: 'Test CPU Model',
    loadAvg: [1.5, 1.2, 1.0],
  },
  memory: {
    total: 17179869184, // 16GB
    used: 8589934592, // 8GB
    free: 8589934592, // 8GB
    usage: 50,
  },
  disk: {
    total: 1099511627776, // 1TB
    used: 549755813888, // 500GB
    free: 549755813888, // 500GB
    usage: 50,
    path: '/',
  },
  network: [
    { name: 'lo', rxBytes: 12345, txBytes: 12345, rxPackets: 100, txPackets: 100 },
    { name: 'eth0', rxBytes: 987654321, txBytes: 123456789, rxPackets: 1000, txPackets: 500 },
  ],
  processes: [
    { pid: 1, name: '/sbin/init', cpu: 0.1, memory: 0.5 },
    { pid: 1234, name: 'node server.js', cpu: 5.2, memory: 3.1 },
  ],
  uptime: 86400, // 1일
  hostname: 'test-server',
  platform: 'Linux 5.15.0',
};

describe('GET /api/system', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 success: true와 시스템 메트릭 데이터를 반환해야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockResolvedValue(mockSystemMetrics);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('응답 데이터에 cpu 정보가 포함되어야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockResolvedValue(mockSystemMetrics);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.data.cpu).toBeDefined();
    expect(data.data.cpu.usage).toBe(45);
    expect(data.data.cpu.cores).toBe(8);
    expect(data.data.cpu.model).toBe('Test CPU Model');
    expect(data.data.cpu.loadAvg).toEqual(['1.50', '1.20', '1.00']);
  });

  it('응답 데이터에 memory 정보가 포함되어야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockResolvedValue(mockSystemMetrics);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.data.memory).toBeDefined();
    expect(data.data.memory.usage).toBe(50);
    expect(data.data.memory.totalBytes).toBe(17179869184);
    expect(data.data.memory.usedBytes).toBe(8589934592);
  });

  it('응답 데이터에 disk 정보가 포함되어야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockResolvedValue(mockSystemMetrics);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.data.disk).toBeDefined();
    expect(data.data.disk.usage).toBe(50);
    expect(data.data.disk.path).toBe('/');
  });

  it('응답 데이터에 uptime, hostname, platform 정보가 포함되어야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockResolvedValue(mockSystemMetrics);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.data.uptimeSeconds).toBe(86400);
    expect(data.data.hostname).toBe('test-server');
    expect(data.data.platform).toBe('Linux 5.15.0');
  });

  it('시스템 에러 시 success: false와 에러 메시지를 반환해야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockRejectedValue(new Error('System error'));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to get system metrics');
  });

  it('예상치 못한 에러도 올바르게 처리해야 한다', async () => {
    // Arrange
    mockGetSystemMetrics.mockRejectedValue('Unknown error');

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to get system metrics');
  });
});
