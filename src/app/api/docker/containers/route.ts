import { NextResponse } from 'next/server';
import {
  listContainers,
  getDockerInfo,
  checkDockerConnection,
} from '@/lib/docker';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Docker 연결 확인
    const isConnected = await checkDockerConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Docker daemon not accessible',
        containers: [],
      });
    }

    // 컨테이너 목록 조회
    const containers = await listContainers(true);
    const dockerInfo = await getDockerInfo();

    return NextResponse.json({
      success: true,
      data: {
        containers: containers.map((c) => ({
          id: c.id,
          name: c.name,
          image: c.image,
          state: c.state,
          status: c.status,
          created: c.created.toISOString(),
          ports: c.ports,
          project: c.project,
        })),
        summary: dockerInfo
          ? {
              total: dockerInfo.containers,
              running: dockerInfo.containersRunning,
              stopped: dockerInfo.containersStopped,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Failed to list containers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list containers' },
      { status: 500 }
    );
  }
}
