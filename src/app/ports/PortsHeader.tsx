'use client';

/**
 * PortsHeader 컴포넌트
 *
 * Ports 페이지 헤더 (Client Component)
 * HelpButton 사용을 위해 분리됨
 */

import { Network } from 'lucide-react';
import { HelpButton } from '@/components/help';

export function PortsHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
        <Network className="h-6 w-6 text-white" />
      </div>
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Port Registry</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            개발 서버 포트 할당 현황 및 예약
          </p>
        </div>
        <HelpButton helpId="page-ports" />
      </div>
    </div>
  );
}
