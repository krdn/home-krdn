import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getContainer,
  startContainer,
  stopContainer,
  restartContainer,
  getContainerLogs,
} from '@/lib/docker';
import { verifyToken } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import type { UserRole } from '@/types/auth';

export const dynamic = 'force-dynamic';

/**
 * JWT에서 역할 추출 헬퍼 함수
 * 미들웨어에서 이미 인증이 완료된 상태이므로, 역할만 추출합니다.
 */
async function extractRoleFromRequest(): Promise<UserRole | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const result = await verifyToken(token);
  if (!result.valid) {
    return null;
  }

  return result.payload.role as UserRole;
}

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

    // 컨테이너 제어 액션(start, stop, restart)은 user 이상 권한 필요
    if (['start', 'stop', 'restart'].includes(action)) {
      const role = await extractRoleFromRequest();

      if (!role) {
        return NextResponse.json(
          { success: false, error: '인증이 필요합니다' },
          { status: 401 }
        );
      }

      if (!hasPermission(role, 'docker', 'write')) {
        return NextResponse.json(
          {
            success: false,
            error: '컨테이너 제어 권한이 없습니다. 필요 권한: user 이상',
          },
          { status: 403 }
        );
      }
    }

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
