'use client';

/**
 * RoleBanner 컴포넌트
 *
 * 현재 사용자의 역할을 표시하는 배너 컴포넌트입니다.
 * Admin 대시보드 헤더에서 사용자의 권한 수준을 표시합니다.
 *
 * Phase 19: RBAC Access Control
 */

import { Shield, User, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

/**
 * 역할별 아이콘 및 스타일 매핑
 */
const roleConfig = {
  admin: {
    icon: Shield,
    label: 'Admin',
    variant: 'default' as const,
    className: 'bg-red-600 hover:bg-red-700',
  },
  user: {
    icon: User,
    label: 'User',
    variant: 'default' as const,
    className: 'bg-blue-600 hover:bg-blue-700',
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    variant: 'secondary' as const,
    className: '',
  },
};

/**
 * 역할 표시 배너
 */
export function RoleBanner() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <span className="h-3 w-3 animate-pulse rounded-full bg-gray-400" />
        Loading...
      </Badge>
    );
  }

  if (!role) {
    return null;
  }

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
