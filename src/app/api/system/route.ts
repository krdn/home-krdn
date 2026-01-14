import { NextResponse } from 'next/server';
import { getSystemMetrics } from '@/lib/system';
import { formatBytes, formatUptime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = await getSystemMetrics();

    return NextResponse.json({
      success: true,
      data: {
        cpu: {
          usage: metrics.cpu.usage,
          cores: metrics.cpu.cores,
          model: metrics.cpu.model,
          loadAvg: metrics.cpu.loadAvg.map((v) => v.toFixed(2)),
        },
        memory: {
          total: formatBytes(metrics.memory.total),
          used: formatBytes(metrics.memory.used),
          free: formatBytes(metrics.memory.free),
          usage: metrics.memory.usage,
          totalBytes: metrics.memory.total,
          usedBytes: metrics.memory.used,
        },
        disk: {
          total: formatBytes(metrics.disk.total),
          used: formatBytes(metrics.disk.used),
          free: formatBytes(metrics.disk.free),
          usage: metrics.disk.usage,
          path: metrics.disk.path,
        },
        uptime: formatUptime(metrics.uptime),
        uptimeSeconds: metrics.uptime,
        hostname: metrics.hostname,
        platform: metrics.platform,
      },
    });
  } catch (error) {
    console.error('Failed to get system metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get system metrics' },
      { status: 500 }
    );
  }
}
