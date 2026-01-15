/**
 * Docker Containers API Route 테스트
 * GET /api/docker/containers - 컨테이너 목록 반환
 *
 * Phase 25: Test Coverage Expansion
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// 모듈 mocking - 실제 Docker 소켓 연결 방지
vi.mock('@/lib/docker', () => ({
  listContainers: vi.fn(),
  getDockerInfo: vi.fn(),
  checkDockerConnection: vi.fn(),
}));

// route import 후 mock 가져오기
import { GET } from './route';
import * as dockerModule from '@/lib/docker';

describe('GET /api/docker/containers', () => {
  const mockListContainers = dockerModule.listContainers as Mock;
  const mockGetDockerInfo = dockerModule.getDockerInfo as Mock;
  const mockCheckDockerConnection = dockerModule.checkDockerConnection as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('컨테이너 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const mockContainers = [
        {
          id: 'abc123456789',
          name: 'webapp',
          image: 'node:18-alpine',
          state: 'running',
          status: 'Up 2 hours',
          created: new Date('2024-01-01T10:00:00Z'),
          ports: ['3000:3000/tcp'],
        },
        {
          id: 'def987654321',
          name: 'database',
          image: 'postgres:15',
          state: 'running',
          status: 'Up 3 days',
          created: new Date('2024-01-01T08:00:00Z'),
          ports: ['5432:5432/tcp'],
        },
      ];

      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue(mockContainers);
      mockGetDockerInfo.mockResolvedValue({
        containers: 5,
        containersRunning: 2,
        containersStopped: 3,
        images: 10,
        memoryTotal: 8589934592,
        cpus: 4,
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.containers).toHaveLength(2);
    });

    it('각 컨테이너에 필수 필드가 포함되어야 한다', async () => {
      // Arrange
      const mockContainers = [
        {
          id: 'container-001',
          name: 'test-app',
          image: 'nginx:latest',
          state: 'running',
          status: 'Up 1 hour',
          created: new Date('2024-01-01T12:00:00Z'),
          ports: ['80:80/tcp'],
        },
      ];

      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue(mockContainers);
      mockGetDockerInfo.mockResolvedValue({
        containers: 1,
        containersRunning: 1,
        containersStopped: 0,
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      const container = data.data.containers[0];
      expect(container).toHaveProperty('id');
      expect(container).toHaveProperty('name');
      expect(container).toHaveProperty('image');
      expect(container).toHaveProperty('state');
      expect(container).toHaveProperty('status');
      expect(container).toHaveProperty('created');
      expect(container).toHaveProperty('ports');
    });

    it('summary 정보가 올바르게 포함되어야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue([]);
      mockGetDockerInfo.mockResolvedValue({
        containers: 10,
        containersRunning: 7,
        containersStopped: 3,
        images: 15,
        memoryTotal: 16000000000,
        cpus: 8,
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.data.summary).toEqual({
        total: 10,
        running: 7,
        stopped: 3,
      });
    });

    it('컨테이너가 없을 때 빈 배열을 반환해야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue([]);
      mockGetDockerInfo.mockResolvedValue({
        containers: 0,
        containersRunning: 0,
        containersStopped: 0,
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.success).toBe(true);
      expect(data.data.containers).toEqual([]);
    });
  });

  describe('Docker 연결 실패', () => {
    it('Docker daemon 연결 불가 시 success: false와 에러를 반환해야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(false);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.success).toBe(false);
      expect(data.error).toBe('Docker daemon not accessible');
      expect(data.containers).toEqual([]);
    });
  });

  describe('에러 처리', () => {
    it('listContainers 에러 시 500을 반환해야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockRejectedValue(new Error('Socket connection failed'));

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to list containers');
    });

    it('getDockerInfo가 null을 반환하면 summary가 null이어야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue([
        {
          id: 'test-123',
          name: 'test-container',
          image: 'alpine:latest',
          state: 'running',
          status: 'Up 5 minutes',
          created: new Date(),
          ports: [],
        },
      ]);
      mockGetDockerInfo.mockResolvedValue(null);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.success).toBe(true);
      expect(data.data.summary).toBeNull();
    });

    it('예상치 못한 에러도 500으로 처리해야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockRejectedValue('Unknown error type');

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('데이터 변환', () => {
    it('created 필드가 ISO 문자열로 변환되어야 한다', async () => {
      // Arrange
      const testDate = new Date('2024-06-15T14:30:00Z');
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue([
        {
          id: 'date-test-123',
          name: 'date-test',
          image: 'test:latest',
          state: 'running',
          status: 'Up 1 day',
          created: testDate,
          ports: [],
        },
      ]);
      mockGetDockerInfo.mockResolvedValue(null);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.data.containers[0].created).toBe('2024-06-15T14:30:00.000Z');
    });

    it('listContainers에 all=true 옵션이 전달되어야 한다', async () => {
      // Arrange
      mockCheckDockerConnection.mockResolvedValue(true);
      mockListContainers.mockResolvedValue([]);
      mockGetDockerInfo.mockResolvedValue(null);

      // Act
      await GET();

      // Assert
      expect(mockListContainers).toHaveBeenCalledWith(true);
    });
  });
});
