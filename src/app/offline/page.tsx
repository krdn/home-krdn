import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { RefreshButton } from './RefreshButton';

export const metadata: Metadata = {
  title: '오프라인 - Home Dashboard',
  description: '인터넷 연결이 없습니다.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 p-4 bg-muted rounded-full inline-block">
          <WifiOff className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">오프라인 상태</h1>
        <p className="text-muted-foreground mb-6">
          인터넷 연결이 없습니다. 연결을 확인하고 다시 시도해주세요.
        </p>
        <RefreshButton />
        <p className="text-xs text-muted-foreground mt-4">
          일부 캐시된 페이지는 오프라인에서도 접근 가능합니다.
        </p>
      </div>
    </div>
  );
}
