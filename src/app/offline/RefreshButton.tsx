'use client';

import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      다시 시도
    </button>
  );
}
