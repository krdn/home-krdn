import { NextResponse } from 'next/server';
import { metricsHistory } from '@/lib/metricsHistory';
import { startMetricsCollection, isSchedulerRunning } from '@/lib/metricsScheduler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system/history
 * 시스템 메트릭 히스토리를 조회합니다.
 *
 * Query Parameters:
 * - minutes: 조회할 시간 범위 (분). 기본값: 60 (1시간)
 *
 * Response:
 * {
 *   success: boolean,
 *   data: MetricsSnapshot[],
 *   meta: {
 *     count: number,
 *     minutes: number,
 *     schedulerRunning: boolean
 *   }
 * }
 */
export async function GET(request: Request) {
  try {
    // 스케줄러가 실행되지 않았으면 시작
    if (!isSchedulerRunning()) {
      startMetricsCollection();
    }

    const { searchParams } = new URL(request.url);
    const minutesParam = searchParams.get('minutes');
    const minutes = minutesParam ? parseInt(minutesParam, 10) : 60;

    // 유효성 검사
    if (isNaN(minutes) || minutes < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid minutes parameter. Must be a non-negative number.',
        },
        { status: 400 }
      );
    }

    const history = metricsHistory.getHistory(minutes);

    return NextResponse.json({
      success: true,
      data: history,
      meta: {
        count: history.length,
        minutes,
        schedulerRunning: isSchedulerRunning(),
      },
    });
  } catch (error) {
    console.error('Failed to get metrics history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get metrics history' },
      { status: 500 }
    );
  }
}
