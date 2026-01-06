import { NextRequest, NextResponse } from 'next/server';
import {
  getContainer,
  startContainer,
  stopContainer,
  restartContainer,
  getContainerLogs,
} from '@/lib/docker';

export const dynamic = 'force-dynamic';

// GET: 컨테이너 상세 정보
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const container = await getContainer(id);

    if (!container) {
      return NextResponse.json(
        { success: false, error: 'Container not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: container,
    });
  } catch (error) {
    console.error(`Failed to get container ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to get container' },
      { status: 500 }
    );
  }
}

// POST: 컨테이너 액션 (start, stop, restart, logs)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, tail = 100 } = body;

    let result: boolean | string;
    let message: string;

    switch (action) {
      case 'start':
        result = await startContainer(id);
        message = result ? 'Container started' : 'Failed to start container';
        break;

      case 'stop':
        result = await stopContainer(id);
        message = result ? 'Container stopped' : 'Failed to stop container';
        break;

      case 'restart':
        result = await restartContainer(id);
        message = result ? 'Container restarted' : 'Failed to restart container';
        break;

      case 'logs':
        const logs = await getContainerLogs(id, tail);
        return NextResponse.json({
          success: true,
          data: { logs },
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: typeof result === 'boolean' ? result : true,
      message,
    });
  } catch (error) {
    console.error(`Failed to perform action on container ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform container action' },
      { status: 500 }
    );
  }
}
