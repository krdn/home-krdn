'use client';

/**
 * 포트 레지스트리 관리 페이지
 *
 * Phase 33: Port Registry System
 * Phase 43: Port Scanner & Guide 확장
 *
 * Admin 권한으로 포트 레지스트리를 관리합니다.
 * 포트 목록 조회, 생성, 수정, 삭제 기능을 제공합니다.
 * 탭 UI로 포트 스캐너와 가이드 기능을 통합합니다.
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Network, Plus, Loader2, List, Scan, BookOpen, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PortList } from '@/components/ports/PortList';
import { AdminOnly } from '@/components/admin/RoleGuard';
import { HelpButton } from '@/components/help';
import { cn } from '@/lib/utils';
import type { PortRegistryDto } from '@/types/port';

// ============================================================
// Dynamic Imports
// ============================================================

// PortForm: Dialog 폼이므로 지연 로딩
const PortForm = dynamic(
  () => import('@/components/ports/PortForm').then((mod) => mod.PortForm),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>폼 로딩 중...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// 로딩 스피너 컴포넌트
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// PortScanner: 탭 전환 시 지연 로딩
const PortScanner = dynamic(
  () => import('@/components/ports/PortScanner').then((mod) => mod.PortScanner),
  { loading: LoadingSpinner, ssr: false }
);

// PortComparison: 탭 전환 시 지연 로딩
const PortComparison = dynamic(
  () => import('@/components/ports/PortComparison').then((mod) => mod.PortComparison),
  { loading: LoadingSpinner, ssr: false }
);

// PortGuide: 탭 전환 시 지연 로딩
const PortGuide = dynamic(
  () => import('@/components/ports/PortGuide').then((mod) => mod.PortGuide),
  { loading: LoadingSpinner, ssr: false }
);

// ============================================================
// 타입 정의
// ============================================================

type TabType = 'list' | 'scanner' | 'comparison' | 'guide';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================
// 상수
// ============================================================

const TABS: TabConfig[] = [
  { id: 'list', label: '포트 목록', icon: List },
  { id: 'scanner', label: '포트 스캐너', icon: Scan },
  { id: 'comparison', label: '포트 비교', icon: GitCompare },
  { id: 'guide', label: '포트 가이드', icon: BookOpen },
];

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 포트 레지스트리 관리 페이지 컴포넌트
 */
export default function PortsPage() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('list');

  // 포트 편집 상태
  const [editingPort, setEditingPort] = useState<PortRegistryDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 포트 수정 핸들러
  const handleEdit = useCallback((port: PortRegistryDto) => {
    setEditingPort(port);
    setIsFormOpen(true);
  }, []);

  // 포트 추가 핸들러
  const handleAdd = useCallback(() => {
    setEditingPort(null);
    setIsFormOpen(true);
  }, []);

  // 폼 닫기 핸들러
  const handleFormClose = useCallback((open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingPort(null);
    }
  }, []);

  return (
    <AdminOnly fallback={<p className="p-4 text-muted-foreground">포트 관리 권한이 없습니다. Admin 역할이 필요합니다.</p>}>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                포트 레지스트리
                <HelpButton helpId="page-admin-ports" size="sm" />
              </h1>
              <p className="text-sm text-muted-foreground">
                포트 할당 관리, 시스템 스캔, 신규 개발 가이드
              </p>
            </div>
          </div>

          {/* 포트 추가 버튼 - list 탭에서만 표시 */}
          {activeTab === 'list' && (
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              포트 추가
            </Button>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mt-4">
          {activeTab === 'list' && (
            <>
              <PortList onEdit={handleEdit} />
              <PortForm
                port={editingPort ?? undefined}
                open={isFormOpen}
                onOpenChange={handleFormClose}
              />
            </>
          )}
          {activeTab === 'scanner' && <PortScanner />}
          {activeTab === 'comparison' && <PortComparison />}
          {activeTab === 'guide' && <PortGuide />}
        </div>
      </div>
    </AdminOnly>
  );
}
