/**
 * Docker API Client
 * Docker socket을 통해 컨테이너 정보를 가져옵니다.
 */
import { ZodError } from 'zod';
import {
  DockerContainerListSchema,
  DockerContainerDetailSchema,
  DockerInfoSchema,
  type DockerContainer,
  type ContainerInfo,
} from '@/types/docker';

// ContainerStats는 docker.ts 내부에서만 사용 (아직 API 검증 미적용)
export interface ContainerStats {
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  memory_percent: number;
}

// Re-export types for external use
export type { DockerContainer, ContainerInfo } from '@/types/docker';

const DOCKER_SOCKET = process.env.DOCKER_HOST || '/var/run/docker.sock';

/**
 * Docker socket으로 HTTP 요청을 보냅니다.
 */
async function dockerRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET'
): Promise<T> {
  // Node.js에서 Unix socket으로 HTTP 요청
  const http = await import('http');

  return new Promise((resolve, reject) => {
    const options = {
      socketPath: DOCKER_SOCKET,
      path,
      method,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          reject(new Error(`Failed to parse Docker response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Docker request failed: ${err.message}`));
    });

    req.end();
  });
}

/**
 * 모든 컨테이너 목록을 가져옵니다.
 */
export async function listContainers(all: boolean = true): Promise<ContainerInfo[]> {
  try {
    const rawData = await dockerRequest<unknown>(
      `/containers/json?all=${all}`
    );

    // 런타임 검증: Docker API 응답 스키마 확인
    const containers = DockerContainerListSchema.parse(rawData);

    return containers.map((c) => ({
      id: c.Id.substring(0, 12),
      name: c.Names[0]?.replace(/^\//, '') || 'unknown',
      image: c.Image,
      state: c.State as ContainerInfo['state'],
      status: c.Status,
      created: new Date(c.Created * 1000),
      ports: c.Ports.filter((p) => p.PublicPort).map(
        (p) => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`
      ),
    }));
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Docker API 응답 검증 실패:', error.issues);
    } else {
      console.error('Failed to list containers:', error);
    }
    return [];
  }
}

/**
 * 특정 컨테이너 정보를 가져옵니다.
 */
export async function getContainer(id: string): Promise<ContainerInfo | null> {
  try {
    const rawData = await dockerRequest<unknown>(
      `/containers/${id}/json`
    );

    // 런타임 검증: Docker API 상세 응답 스키마 확인
    const container = DockerContainerDetailSchema.parse(rawData);

    // 포트 정보 추출 (상세 조회 응답 구조에 맞게)
    const ports: string[] = [];
    if (container.NetworkSettings?.Ports) {
      for (const [containerPort, hostBindings] of Object.entries(container.NetworkSettings.Ports)) {
        if (hostBindings) {
          for (const binding of hostBindings) {
            ports.push(`${binding.HostPort}:${containerPort}`);
          }
        }
      }
    }

    return {
      id: container.Id.substring(0, 12),
      name: container.Name.replace(/^\//, ''),
      image: container.Image,
      state: container.State.Status as ContainerInfo['state'],
      status: container.State.Running ? 'running' : container.State.Status,
      created: new Date(container.Created),
      ports,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`Docker API 응답 검증 실패 (container ${id}):`, error.issues);
    } else {
      console.error(`Failed to get container ${id}:`, error);
    }
    return null;
  }
}

/**
 * 컨테이너를 시작합니다.
 */
export async function startContainer(id: string): Promise<boolean> {
  try {
    await dockerRequest(`/containers/${id}/start`, 'POST');
    return true;
  } catch (error) {
    console.error(`Failed to start container ${id}:`, error);
    return false;
  }
}

/**
 * 컨테이너를 중지합니다.
 */
export async function stopContainer(id: string): Promise<boolean> {
  try {
    await dockerRequest(`/containers/${id}/stop`, 'POST');
    return true;
  } catch (error) {
    console.error(`Failed to stop container ${id}:`, error);
    return false;
  }
}

/**
 * 컨테이너를 재시작합니다.
 */
export async function restartContainer(id: string): Promise<boolean> {
  try {
    await dockerRequest(`/containers/${id}/restart`, 'POST');
    return true;
  } catch (error) {
    console.error(`Failed to restart container ${id}:`, error);
    return false;
  }
}

/**
 * 컨테이너 로그를 가져옵니다.
 */
export async function getContainerLogs(
  id: string,
  tail: number = 100
): Promise<string> {
  const http = await import('http');

  return new Promise((resolve, reject) => {
    const options = {
      socketPath: DOCKER_SOCKET,
      path: `/containers/${id}/logs?stdout=true&stderr=true&tail=${tail}`,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        // Docker 로그는 특수 헤더가 있어서 처리 필요
        const buffer = Buffer.concat(chunks);
        const logs = cleanDockerLogs(buffer);
        resolve(logs);
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Failed to get logs: ${err.message}`));
    });

    req.end();
  });
}

/**
 * Docker 로그의 특수 헤더를 제거합니다.
 */
function cleanDockerLogs(buffer: Buffer): string {
  const lines: string[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    // Docker 로그 포맷: [8-byte header][payload]
    if (offset + 8 > buffer.length) break;

    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;

    if (offset + size > buffer.length) break;

    const line = buffer.toString('utf8', offset, offset + size);
    lines.push(line.trim());
    offset += size;
  }

  // 헤더 파싱 실패 시 원본 반환
  if (lines.length === 0) {
    return buffer.toString('utf8');
  }

  return lines.join('\n');
}

/**
 * Docker 데몬 연결 상태를 확인합니다.
 */
export async function checkDockerConnection(): Promise<boolean> {
  try {
    await dockerRequest('/version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Docker 시스템 정보를 가져옵니다.
 */
export async function getDockerInfo(): Promise<{
  containers: number;
  containersRunning: number;
  containersStopped: number;
  images: number;
  memoryTotal: number;
  cpus: number;
} | null> {
  try {
    const rawData = await dockerRequest<unknown>('/info');

    // 런타임 검증: Docker Info 응답 스키마 확인
    const info = DockerInfoSchema.parse(rawData);

    return {
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersStopped: info.ContainersStopped,
      images: info.Images,
      memoryTotal: info.MemTotal,
      cpus: info.NCPU,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Docker Info API 응답 검증 실패:', error.issues);
    } else {
      console.error('Failed to get Docker info:', error);
    }
    return null;
  }
}
