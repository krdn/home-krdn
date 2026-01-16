'use client';

/**
 * PortForm 컴포넌트
 *
 * 포트 생성/수정을 위한 Dialog 폼 컴포넌트입니다.
 * 포트 번호 입력 시 실시간 충돌 검사를 제공합니다.
 *
 * Phase 33: Port Registry System
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { X, Network, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCreatePort, useUpdatePort, useCheckPort } from '@/hooks/usePorts';
import {
  PORT_CATEGORIES,
  PORT_ENVIRONMENTS,
  PORT_STATUSES,
  PORT_PROTOCOLS,
  PORT_RANGE,
  type PortRegistryDto,
  type PortCategory,
  type PortEnvironment,
  type PortStatus,
  type PortProtocol,
  type CreatePortInput,
} from '@/types/port';

// ============================================================
// 라벨 매핑
// ============================================================

const categoryLabels: Record<PortCategory, string> = {
  ai: 'AI',
  web: 'Web',
  n8n: 'N8N',
  system: 'System',
  database: 'Database',
  monitoring: 'Monitoring',
  other: '기타',
};

const environmentLabels: Record<PortEnvironment, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
};

const statusLabels: Record<PortStatus, string> = {
  active: '활성',
  reserved: '예약',
  deprecated: '폐기',
};

const protocolLabels: Record<PortProtocol, string> = {
  tcp: 'TCP',
  udp: 'UDP',
};

// ============================================================
// 폼 데이터 타입
// ============================================================

interface FormData {
  port: string;
  projectName: string;
  description: string;
  protocol: PortProtocol;
  environment: PortEnvironment;
  status: PortStatus;
  internalUrl: string;
  externalUrl: string;
  category: PortCategory | '';
}

const defaultFormData: FormData = {
  port: '',
  projectName: '',
  description: '',
  protocol: 'tcp',
  environment: 'development',
  status: 'active',
  internalUrl: '',
  externalUrl: '',
  category: '',
};

// ============================================================
// Props
// ============================================================

interface PortFormProps {
  port?: PortRegistryDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================
// 컴포넌트
// ============================================================

export function PortForm({ port, open, onOpenChange }: PortFormProps) {
  const isEditing = !!port;

  // 폼 데이터 상태
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 충돌 검사 상태
  const [isChecking, setIsChecking] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<PortRegistryDto | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Mutations
  const createPort = useCreatePort();
  const updatePort = useUpdatePort();
  const checkPort = useCheckPort();

  // 포트가 변경되면 폼 데이터 초기화
  useEffect(() => {
    if (open) {
      if (port) {
        setFormData({
          port: port.port.toString(),
          projectName: port.projectName,
          description: port.description || '',
          protocol: port.protocol,
          environment: port.environment,
          status: port.status,
          internalUrl: port.internalUrl || '',
          externalUrl: port.externalUrl || '',
          category: port.category || '',
        });
        // 수정 모드에서는 충돌 정보 초기화
        setConflictInfo(null);
      } else {
        setFormData(defaultFormData);
        setConflictInfo(null);
      }
      setErrors({});
    }
  }, [open, port]);

  // 포트 번호 변경 시 충돌 검사 (debounce 300ms)
  const handlePortChange = useCallback(
    (portValue: string) => {
      setFormData((prev) => ({ ...prev, port: portValue }));
      setConflictInfo(null);

      // 기존 타이머 취소
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      const portNum = parseInt(portValue, 10);

      // 유효한 포트 번호일 때만 검사
      if (!isNaN(portNum) && portNum >= PORT_RANGE.MIN && portNum <= PORT_RANGE.MAX) {
        setIsChecking(true);
        debounceTimer.current = setTimeout(async () => {
          try {
            const result = await checkPort.mutateAsync({
              port: portNum,
              excludeId: port?.id, // 수정 시 자기 자신 제외
            });

            if (!result.available && result.conflict) {
              setConflictInfo(result.conflict);
            } else {
              setConflictInfo(null);
            }
          } catch {
            // 검사 실패 시 무시
          } finally {
            setIsChecking(false);
          }
        }, 300);
      } else {
        setIsChecking(false);
      }
    },
    [checkPort, port?.id]
  );

  // 폼 유효성 검사
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // 포트 번호 검증
    const portNum = parseInt(formData.port, 10);
    if (!formData.port.trim()) {
      newErrors.port = '포트 번호를 입력해주세요';
    } else if (isNaN(portNum)) {
      newErrors.port = '유효한 숫자를 입력해주세요';
    } else if (portNum < PORT_RANGE.MIN || portNum > PORT_RANGE.MAX) {
      newErrors.port = `포트 번호는 ${PORT_RANGE.MIN}~${PORT_RANGE.MAX} 범위여야 합니다`;
    }

    // 프로젝트 이름 검증
    if (!formData.projectName.trim()) {
      newErrors.projectName = '프로젝트 이름을 입력해주세요';
    } else if (formData.projectName.length > 100) {
      newErrors.projectName = '프로젝트 이름은 최대 100자까지 가능합니다';
    }

    // 설명 검증
    if (formData.description && formData.description.length > 500) {
      newErrors.description = '설명은 최대 500자까지 가능합니다';
    }

    // URL 검증 (비어있지 않은 경우만)
    const urlPattern = /^https?:\/\/.+/;
    if (formData.internalUrl && !urlPattern.test(formData.internalUrl)) {
      newErrors.internalUrl = '유효한 URL을 입력해주세요 (http:// 또는 https://)';
    }
    if (formData.externalUrl && !urlPattern.test(formData.externalUrl)) {
      newErrors.externalUrl = '유효한 URL을 입력해주세요 (http:// 또는 https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 폼 제출
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      // 충돌 상태에서 제출 시 경고
      if (conflictInfo) {
        if (
          !confirm(
            `포트 ${formData.port}은(는) "${conflictInfo.projectName}"에서 사용 중입니다.\n그래도 저장하시겠습니까?`
          )
        ) {
          return;
        }
      }

      setIsSubmitting(true);

      try {
        const inputData: CreatePortInput = {
          port: parseInt(formData.port, 10),
          projectName: formData.projectName.trim(),
          description: formData.description.trim() || null,
          protocol: formData.protocol,
          environment: formData.environment,
          status: formData.status,
          internalUrl: formData.internalUrl.trim() || null,
          externalUrl: formData.externalUrl.trim() || null,
          category: formData.category || null,
          tags: [], // 현재 UI에서는 태그 편집 미지원
        };

        if (port) {
          await updatePort.mutateAsync({
            id: port.id,
            data: inputData,
          });
        } else {
          await createPort.mutateAsync(inputData);
        }

        onOpenChange(false);
      } catch (err) {
        // API 오류 처리
        const message = err instanceof Error ? err.message : '저장에 실패했습니다';
        setErrors((prev) => ({ ...prev, port: message }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      port,
      conflictInfo,
      validateForm,
      createPort,
      updatePort,
      onOpenChange,
    ]
  );

  // cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <Network className="h-5 w-5 text-primary" aria-hidden="true" />
              {isEditing ? '포트 수정' : '새 포트 등록'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 hover:bg-muted" aria-label="닫기">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 포트 번호 & 프로토콜 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium" htmlFor="port">
                  포트 번호 <span className="text-destructive">*</span>
                </label>
                <input
                  id="port"
                  type="number"
                  min={PORT_RANGE.MIN}
                  max={PORT_RANGE.MAX}
                  value={formData.port}
                  onChange={(e) => handlePortChange(e.target.value)}
                  placeholder="예: 3000"
                  aria-invalid={!!errors.port}
                  aria-describedby={errors.port ? 'port-error' : undefined}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {/* 충돌 경고 */}
                {isChecking && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    충돌 검사 중...
                  </p>
                )}
                {!isChecking && conflictInfo && (
                  <p className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertTriangle className="h-3 w-3" />
                    포트 {formData.port}은(는) "{conflictInfo.projectName}"에서 사용 중입니다
                  </p>
                )}
                {!isChecking && !conflictInfo && formData.port && !errors.port && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    사용 가능한 포트입니다
                  </p>
                )}
                {errors.port && (
                  <p id="port-error" role="alert" className="text-xs text-destructive">
                    {errors.port}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="protocol">
                  프로토콜
                </label>
                <div className="relative">
                  <select
                    id="protocol"
                    value={formData.protocol}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        protocol: e.target.value as PortProtocol,
                      }))
                    }
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PORT_PROTOCOLS.map((p) => (
                      <option key={p} value={p}>
                        {protocolLabels[p]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* 프로젝트 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="projectName">
                프로젝트 이름 <span className="text-destructive">*</span>
              </label>
              <input
                id="projectName"
                type="text"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, projectName: e.target.value }))
                }
                placeholder="예: home-krdn"
                aria-invalid={!!errors.projectName}
                aria-describedby={errors.projectName ? 'projectName-error' : undefined}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.projectName && (
                <p id="projectName-error" role="alert" className="text-xs text-destructive">
                  {errors.projectName}
                </p>
              )}
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                설명
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="포트 용도에 대한 설명"
                rows={2}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.description && (
                <p id="description-error" role="alert" className="text-xs text-destructive">
                  {errors.description}
                </p>
              )}
            </div>

            {/* 환경 & 상태 & 카테고리 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="environment">
                  환경
                </label>
                <div className="relative">
                  <select
                    id="environment"
                    value={formData.environment}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        environment: e.target.value as PortEnvironment,
                      }))
                    }
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

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">
                  상태
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as PortStatus,
                      }))
                    }
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PORT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="category">
                  카테고리
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as PortCategory | '',
                      }))
                    }
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">선택 안함</option>
                    {PORT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* 내부 URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="internalUrl">
                내부 URL
              </label>
              <input
                id="internalUrl"
                type="url"
                value={formData.internalUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, internalUrl: e.target.value }))
                }
                placeholder="예: http://localhost:3000"
                aria-invalid={!!errors.internalUrl}
                aria-describedby={errors.internalUrl ? 'internalUrl-error' : undefined}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.internalUrl && (
                <p id="internalUrl-error" role="alert" className="text-xs text-destructive">
                  {errors.internalUrl}
                </p>
              )}
            </div>

            {/* 외부 URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="externalUrl">
                외부 URL
              </label>
              <input
                id="externalUrl"
                type="url"
                value={formData.externalUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, externalUrl: e.target.value }))
                }
                placeholder="예: https://myapp.example.com"
                aria-invalid={!!errors.externalUrl}
                aria-describedby={errors.externalUrl ? 'externalUrl-error' : undefined}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.externalUrl && (
                <p id="externalUrl-error" role="alert" className="text-xs text-destructive">
                  {errors.externalUrl}
                </p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={isSubmitting || isChecking}
              >
                {isSubmitting ? '저장 중...' : isEditing ? '수정' : '등록'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
