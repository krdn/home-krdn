'use client';

/**
 * PortQuickReserve 컴포넌트
 *
 * 신규 프로젝트 시작 시 포트를 빠르게 예약할 수 있는 컴포넌트입니다.
 * 카테고리와 환경을 선택하면 자동으로 사용 가능한 포트를 추천합니다.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Zap,
  ChevronDown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { usePortRecommendation, useCreatePort } from '@/hooks/usePorts';
import {
  PORT_CATEGORIES,
  PORT_ENVIRONMENTS,
  PORT_CATEGORY_RANGES,
  type PortCategory,
  type PortEnvironment,
} from '@/types/port';

// ============================================================
// 라벨 매핑
// ============================================================

const categoryLabels: Record<PortCategory, string> = {
  ai: 'AI/ML',
  web: 'Web',
  n8n: 'N8N',
  system: 'System',
  database: 'Database',
  monitoring: 'Monitoring',
  other: '기타',
};

const categoryEmoji: Record<PortCategory, string> = {
  ai: '🤖',
  web: '🌐',
  n8n: '⚡',
  system: '⚙️',
  database: '🗄️',
  monitoring: '📊',
  other: '📦',
};

const environmentLabels: Record<PortEnvironment, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
};

// ============================================================
// Props
// ============================================================

interface PortQuickReserveProps {
  onReserved?: (port: number, projectName: string) => void;
}

// ============================================================
// 컴포넌트
// ============================================================

export function PortQuickReserve({ onReserved }: PortQuickReserveProps) {
  // 선택 상태
  const [category, setCategory] = useState<PortCategory | undefined>(undefined);
  const [environment, setEnvironment] = useState<PortEnvironment>('development');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // 예약 상태
  const [isReserving, setIsReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // Hooks
  const { recommendation, usage, isLoading } = usePortRecommendation(category, environment);
  const createPort = useCreatePort();

  // 포트 선택
  const handleSelectPort = useCallback((port: number) => {
    setSelectedPort(port);
    setCopied(false);
    setReserveError(null);
    setReserveSuccess(false);
  }, []);

  // 포트 복사
  const handleCopyPort = useCallback(() => {
    if (selectedPort) {
      navigator.clipboard.writeText(selectedPort.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [selectedPort]);

  // 포트 예약
  const handleReserve = useCallback(async () => {
    if (!selectedPort || !projectName.trim()) {
      setReserveError('프로젝트 이름을 입력해주세요');
      return;
    }

    setIsReserving(true);
    setReserveError(null);

    try {
      await createPort.mutateAsync({
        port: selectedPort,
        projectName: projectName.trim(),
        description: description.trim() || null,
        protocol: 'tcp',
        environment,
        status: 'reserved',
        category: category || null,
        internalUrl: `http://localhost:${selectedPort}`,
        tags: [],
      });

      setReserveSuccess(true);
      onReserved?.(selectedPort, projectName.trim());

      // 초기화
      setTimeout(() => {
        setSelectedPort(null);
        setProjectName('');
        setDescription('');
        setReserveSuccess(false);
      }, 2000);
    } catch (err) {
      setReserveError(err instanceof Error ? err.message : '예약에 실패했습니다');
    } finally {
      setIsReserving(false);
    }
  }, [selectedPort, projectName, description, environment, category, createPort, onReserved]);

  return (
    <div className="rounded-lg border bg-card p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">빠른 포트 예약</h3>
          <p className="text-sm text-muted-foreground">
            신규 프로젝트를 위한 포트를 빠르게 예약하세요
          </p>
        </div>
      </div>

      {/* 카테고리 & 환경 선택 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* 카테고리 선택 */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="quick-category">
            프로젝트 카테고리
          </label>
          <div className="relative">
            <select
              id="quick-category"
              value={category || ''}
              onChange={(e) => {
                setCategory(e.target.value as PortCategory || undefined);
                setSelectedPort(null);
              }}
              className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">카테고리 선택...</option>
              {PORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryEmoji[cat]} {categoryLabels[cat]} ({PORT_CATEGORY_RANGES[cat].start}-{PORT_CATEGORY_RANGES[cat].end})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* 환경 선택 */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="quick-environment">
            환경
          </label>
          <div className="relative">
            <select
              id="quick-environment"
              value={environment}
              onChange={(e) => {
                setEnvironment(e.target.value as PortEnvironment);
                setSelectedPort(null);
              }}
              className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PORT_ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {environmentLabels[env]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* 추천 포트 */}
      {category && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">추천 포트</span>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              포트 검색 중...
            </div>
          ) : recommendation ? (
            <div className="space-y-3">
              {/* 추천 포트 버튼들 */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectPort(recommendation.port)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPort === recommendation.port
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  :{recommendation.port}
                  <span className="ml-2 text-xs text-green-500">(추천)</span>
                </button>
                {recommendation.alternativePorts.map((port) => (
                  <button
                    key={port}
                    onClick={() => handleSelectPort(port)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      selectedPort === port
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    :{port}
                  </button>
                ))}
              </div>

              {/* 범위 정보 */}
              <p className="text-xs text-muted-foreground">
                {recommendation.rangeInfo.description} | 범위: {recommendation.rangeInfo.start}-{recommendation.rangeInfo.end}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              해당 범위에 사용 가능한 포트가 없습니다
            </div>
          )}
        </div>
      )}

      {/* 카테고리 미선택 시 사용 현황 */}
      {!category && usage && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium">카테고리별 사용 현황</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(usage).map(([cat, info]) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as PortCategory)}
                className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span>{categoryEmoji[cat as PortCategory]}</span>
                  <span className="text-sm font-medium">{categoryLabels[cat as PortCategory]}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className={info.available > 0 ? 'text-green-500' : 'text-red-500'}>
                    {info.available}개 가용
                  </span>
                  <span className="mx-1">/</span>
                  <span>{info.total}개</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 프로젝트 정보 입력 (포트 선택 시) */}
      {selectedPort && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">선택된 포트:</span>
              <span className="rounded bg-primary/10 px-2 py-1 font-mono text-sm font-bold text-primary">
                :{selectedPort}
              </span>
            </div>
            <button
              onClick={handleCopyPort}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>

          {/* 프로젝트 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quick-project-name">
              프로젝트 이름 <span className="text-destructive">*</span>
            </label>
            <input
              id="quick-project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="예: my-new-project"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 설명 (선택) */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quick-description">
              설명 (선택)
            </label>
            <input
              id="quick-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="프로젝트 설명"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 에러/성공 메시지 */}
          {reserveError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {reserveError}
            </div>
          )}
          {reserveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              포트 {selectedPort}이(가) "{projectName}"으로 예약되었습니다!
            </div>
          )}

          {/* 예약 버튼 */}
          <Button
            onClick={handleReserve}
            disabled={isReserving || !projectName.trim() || reserveSuccess}
            className="w-full"
          >
            {isReserving ? '예약 중...' : reserveSuccess ? '예약 완료!' : '포트 예약하기'}
          </Button>
        </div>
      )}
    </div>
  );
}
