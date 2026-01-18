'use client';

/**
 * PortsContent 컴포넌트
 *
 * Ports 페이지의 클라이언트 컴포넌트
 * 탭으로 포트 목록과 빠른 예약 기능을 제공합니다.
 */

import { useState, useCallback } from 'react';
import { List, Zap } from 'lucide-react';
import { PortList } from '@/components/ports/PortList';
import { PortQuickReserve } from '@/components/ports/PortQuickReserve';

type Tab = 'list' | 'reserve';

export function PortsContent() {
  const [activeTab, setActiveTab] = useState<Tab>('list');

  const handleReserved = useCallback((port: number, projectName: string) => {
    // 예약 완료 후 목록 탭으로 전환
    setTimeout(() => {
      setActiveTab('list');
    }, 1500);
  }, []);

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'list'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          포트 목록
        </button>
        <button
          onClick={() => setActiveTab('reserve')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'reserve'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-4 w-4" />
          빠른 예약
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'list' && <PortList readOnly />}
      {activeTab === 'reserve' && <PortQuickReserve onReserved={handleReserved} />}
    </div>
  );
}
