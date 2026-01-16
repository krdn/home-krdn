'use client';

/**
 * 포트 레지스트리 관리 페이지
 *
 * Phase 33: Port Registry System
 *
 * Admin 권한으로 포트 레지스트리를 관리합니다.
 * 포트 목록 조회, 생성, 수정, 삭제 기능을 제공합니다.
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Network, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PortList } from '@/components/ports/PortList';
import { AdminOnly } from '@/components/admin/RoleGuard';
import type { PortRegistryDto } from '@/types/port';

// Dynamic Import: PortForm은 Dialog 폼이므로 지연 로딩
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
    ssr: false, // 모달은 클라이언트에서만 필요
  }
);

/**
 * 포트 레지스트리 관리 페이지 컴포넌트
 */
export default function PortsPage() {
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
              <h1 className="text-2xl font-bold">포트 레지스트리</h1>
              <p className="text-sm text-muted-foreground">
                개발 프로젝트의 포트 할당을 관리합니다.
              </p>
            </div>
          </div>

          {/* 포트 추가 버튼 */}
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            포트 추가
          </Button>
        </div>

        {/* 포트 목록 */}
        <PortList onEdit={handleEdit} />

        {/* 포트 추가/수정 폼 */}
        <PortForm
          port={editingPort ?? undefined}
          open={isFormOpen}
          onOpenChange={handleFormClose}
        />
      </div>
    </AdminOnly>
  );
}
