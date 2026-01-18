/**
 * Docker API 응답 스키마 (Zod)
 * Docker socket API의 응답을 런타임에 검증합니다.
 */
import { z } from 'zod';

// Docker API Port 정보 스키마
export const DockerPortSchema = z.object({
  IP: z.string().optional(),
  PrivatePort: z.number(),
  PublicPort: z.number().optional(),
  Type: z.string(),
});

// Docker API Container 응답 스키마 (/containers/json)
export const DockerContainerSchema = z.object({
  Id: z.string(),
  Names: z.array(z.string()),
  Image: z.string(),
  State: z.string(),
  Status: z.string(),
  Created: z.number(),
  Ports: z.array(DockerPortSchema),
  Labels: z.record(z.string(), z.string()).optional(),
});

// Container 목록 응답 스키마
export const DockerContainerListSchema = z.array(DockerContainerSchema);

// Docker API 상세 컨테이너 정보 스키마 (/containers/{id}/json)
// 단일 컨테이너 조회 시 응답 구조가 다름
export const DockerContainerDetailSchema = z.object({
  Id: z.string(),
  Name: z.string(), // 단일 조회 시 Names가 아닌 Name
  Image: z.string(),
  State: z.object({
    Status: z.string(),
    Running: z.boolean(),
    Paused: z.boolean(),
    Restarting: z.boolean(),
    Dead: z.boolean(),
  }),
  Created: z.string(), // ISO 날짜 문자열
  NetworkSettings: z.object({
    Ports: z.record(
      z.string(),
      z.array(
        z.object({
          HostIp: z.string(),
          HostPort: z.string(),
        })
      ).nullable()
    ).optional(),
  }).optional(),
});

// Docker Info 응답 스키마 (/info)
export const DockerInfoSchema = z.object({
  Containers: z.number(),
  ContainersRunning: z.number(),
  ContainersStopped: z.number(),
  Images: z.number(),
  MemTotal: z.number(),
  NCPU: z.number(),
});

// Docker Version 응답 스키마 (/version)
export const DockerVersionSchema = z.object({
  Version: z.string(),
  ApiVersion: z.string(),
}).passthrough(); // 추가 필드 허용

// 변환된 내부 타입 (기존 인터페이스와 호환)
export const ContainerInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  state: z.enum(['running', 'exited', 'paused', 'restarting', 'dead']),
  status: z.string(),
  created: z.date(),
  ports: z.array(z.string()),
  project: z.string().optional(), // docker-compose 프로젝트 이름
});

// 타입 추출
export type DockerPort = z.infer<typeof DockerPortSchema>;
export type DockerContainer = z.infer<typeof DockerContainerSchema>;
export type DockerContainerDetail = z.infer<typeof DockerContainerDetailSchema>;
export type DockerInfo = z.infer<typeof DockerInfoSchema>;
export type DockerVersion = z.infer<typeof DockerVersionSchema>;
export type ContainerInfo = z.infer<typeof ContainerInfoSchema>;
