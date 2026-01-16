'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Plus, Search, FileText, BarChart3 } from 'lucide-react';
import type { LogAlertRule, NewLogAlertRule, LogAlertConditionType } from '@/types/log-alert';
import type { LogLevel } from '@/types/log';

interface LogAlertRuleFormProps {
  rule?: LogAlertRule;
  onSubmit: (data: NewLogAlertRule & { global?: boolean }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isAdmin?: boolean;
}

// 기본 폼 값
const defaultFormData = {
  name: '',
  description: '',
  conditionType: 'keyword' as LogAlertConditionType,
  keywords: [] as string[],
  pattern: '',
  caseSensitive: false,
  level: 'error' as LogLevel,
  threshold: 5,
  windowMinutes: 5,
  sources: [] as string[],
  severity: 'warning' as 'info' | 'warning' | 'critical',
  cooldownMinutes: 5,
  enabled: true,
  global: false,
};

/**
 * 로그 알림 규칙 생성/수정 폼
 */
export function LogAlertRuleForm({
  rule,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isAdmin = false,
}: LogAlertRuleFormProps) {
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [keywordInput, setKeywordInput] = useState('');
  const [patternError, setPatternError] = useState<string | null>(null);

  // 수정 모드: 기존 규칙 데이터로 초기화
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        conditionType: rule.condition.type,
        keywords: rule.condition.keywords || [],
        pattern: rule.condition.pattern || '',
        caseSensitive: rule.condition.caseSensitive || false,
        level: rule.condition.level || 'error',
        threshold: rule.condition.threshold || 5,
        windowMinutes: rule.condition.windowMinutes || 5,
        sources: rule.sources || [],
        severity: rule.severity,
        cooldownMinutes: Math.floor(rule.cooldown / 60),
        enabled: rule.enabled,
        global: !rule.userId,
      });
    }
  }, [rule]);

  // 키워드 추가
  const handleAddKeyword = useCallback(() => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
      }));
      setKeywordInput('');
    }
  }, [keywordInput, formData.keywords]);

  // 키워드 삭제
  const handleRemoveKeyword = useCallback((keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  }, []);

  // 키워드 엔터 입력
  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  // 패턴 유효성 검증
  const validatePattern = useCallback((pattern: string) => {
    if (!pattern) {
      setPatternError(null);
      return true;
    }
    try {
      new RegExp(pattern);
      setPatternError(null);
      return true;
    } catch {
      setPatternError('유효하지 않은 정규식 패턴입니다');
      return false;
    }
  }, []);

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 패턴 검증
    if (formData.conditionType === 'pattern' && !validatePattern(formData.pattern)) {
      return;
    }

    // 조건 객체 생성
    const condition = {
      type: formData.conditionType,
      caseSensitive: formData.caseSensitive,
      ...(formData.conditionType === 'keyword' && {
        keywords: formData.keywords,
      }),
      ...(formData.conditionType === 'pattern' && {
        pattern: formData.pattern,
      }),
      ...(formData.conditionType === 'frequency' && {
        level: formData.level,
        threshold: formData.threshold,
        windowMinutes: formData.windowMinutes,
      }),
    };

    // 데이터 구성
    const data: NewLogAlertRule & { global?: boolean } = {
      name: formData.name,
      description: formData.description || undefined,
      condition,
      sources: formData.sources.length > 0 ? formData.sources as ('docker' | 'journal' | 'app')[] : undefined,
      severity: formData.severity,
      cooldown: formData.cooldownMinutes * 60,
      enabled: formData.enabled,
      ...(isAdmin && { global: formData.global }),
    };

    onSubmit(data);
  };

  // 입력 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 숫자 입력 핸들러
  const handleNumberChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 규칙명 */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          규칙명 <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleInputChange}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="예: 에러 로그 감지"
        />
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          설명
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="규칙에 대한 설명을 입력하세요"
        />
      </div>

      {/* 조건 타입 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">조건 타입</label>
        <div className="grid grid-cols-3 gap-2">
          {(['keyword', 'pattern', 'frequency'] as const).map((type) => {
            const Icon = { keyword: Search, pattern: FileText, frequency: BarChart3 }[type];
            const label = { keyword: '키워드', pattern: '패턴', frequency: '빈도' }[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, conditionType: type }))}
                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition-all ${
                  formData.conditionType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 조건 타입별 필드 */}
      <div className="rounded-md border bg-muted/30 p-4 space-y-4">
        {/* Keyword 조건 */}
        {formData.conditionType === 'keyword' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">키워드</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="키워드 입력 후 Enter"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="caseSensitive"
                name="caseSensitive"
                type="checkbox"
                checked={formData.caseSensitive}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="caseSensitive" className="text-sm">
                대소문자 구분
              </label>
            </div>
          </>
        )}

        {/* Pattern 조건 */}
        {formData.conditionType === 'pattern' && (
          <>
            <div className="space-y-2">
              <label htmlFor="pattern" className="text-sm font-medium">
                정규식 패턴
              </label>
              <input
                id="pattern"
                name="pattern"
                type="text"
                value={formData.pattern}
                onChange={(e) => {
                  handleInputChange(e);
                  validatePattern(e.target.value);
                }}
                className={`w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  patternError ? 'border-destructive' : ''
                }`}
                placeholder="예: error|exception|failed"
              />
              {patternError && (
                <p className="text-xs text-destructive">{patternError}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="caseSensitive"
                name="caseSensitive"
                type="checkbox"
                checked={formData.caseSensitive}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="caseSensitive" className="text-sm">
                대소문자 구분
              </label>
            </div>
          </>
        )}

        {/* Frequency 조건 */}
        {formData.conditionType === 'frequency' && (
          <>
            <div className="space-y-2">
              <label htmlFor="level" className="text-sm font-medium">
                타겟 레벨
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="threshold" className="text-sm font-medium">
                  발생 횟수
                </label>
                <input
                  id="threshold"
                  type="number"
                  min={1}
                  max={1000}
                  value={formData.threshold}
                  onChange={(e) => handleNumberChange('threshold', parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="windowMinutes" className="text-sm font-medium">
                  시간 윈도우 (분)
                </label>
                <input
                  id="windowMinutes"
                  type="number"
                  min={1}
                  max={60}
                  value={formData.windowMinutes}
                  onChange={(e) => handleNumberChange('windowMinutes', parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 심각도 */}
      <div className="space-y-2">
        <label htmlFor="severity" className="text-sm font-medium">
          심각도
        </label>
        <select
          id="severity"
          name="severity"
          value={formData.severity}
          onChange={handleInputChange}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="info">정보</option>
          <option value="warning">경고</option>
          <option value="critical">심각</option>
        </select>
      </div>

      {/* 쿨다운 */}
      <div className="space-y-2">
        <label htmlFor="cooldownMinutes" className="text-sm font-medium">
          쿨다운 (분)
        </label>
        <input
          id="cooldownMinutes"
          type="number"
          min={0}
          max={1440}
          value={formData.cooldownMinutes}
          onChange={(e) => handleNumberChange('cooldownMinutes', parseInt(e.target.value) || 0)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          동일 규칙에서 알림 발생 후 다음 알림까지의 대기 시간
        </p>
      </div>

      {/* 전역 규칙 (Admin만) */}
      {isAdmin && (
        <div className="flex items-center gap-2 rounded-md border bg-blue-500/10 p-3">
          <input
            id="global"
            name="global"
            type="checkbox"
            checked={formData.global}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="global" className="text-sm">
            전역 규칙으로 설정 (모든 사용자에게 적용)
          </label>
        </div>
      )}

      {/* 활성화 */}
      <div className="flex items-center gap-2">
        <input
          id="enabled"
          name="enabled"
          type="checkbox"
          checked={formData.enabled}
          onChange={handleInputChange}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="enabled" className="text-sm">
          규칙 활성화
        </label>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : rule ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}
