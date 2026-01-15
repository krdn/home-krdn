'use client';

/**
 * TeamSettingsPanel 컴포넌트
 *
 * 팀 알림 설정을 관리하는 패널/모달
 * - 이메일 알림 토글
 * - Slack 웹훅 URL 입력
 * - 알림 대상 체크박스 (시스템 경고, 멤버 가입, 멤버 탈퇴)
 *
 * Phase 21: Team Features
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Loader2,
  Check,
} from 'lucide-react';
import { useTeamSettings, useUpdateTeamSettings } from '@/hooks/useTeams';

interface TeamSettingsPanelProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamSettingsPanel({
  teamId,
  teamName,
  isOpen,
  onClose,
}: TeamSettingsPanelProps) {
  const { settings, isLoading } = useTeamSettings(isOpen ? teamId : null);
  const updateSettings = useUpdateTeamSettings(teamId);

  // 로컬 폼 상태
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [notifyOnAlert, setNotifyOnAlert] = useState(true);
  const [notifyOnMemberJoin, setNotifyOnMemberJoin] = useState(true);
  const [notifyOnMemberLeave, setNotifyOnMemberLeave] = useState(false);

  // 설정 로드 시 폼 상태 초기화
  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.emailNotifications);
      setSlackWebhookUrl(settings.slackWebhookUrl || '');
      setNotifyOnAlert(settings.notifyOnAlert);
      setNotifyOnMemberJoin(settings.notifyOnMemberJoin);
      setNotifyOnMemberLeave(settings.notifyOnMemberLeave);
    }
  }, [settings]);

  // 저장 핸들러
  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        emailNotifications,
        slackWebhookUrl: slackWebhookUrl.trim() || null,
        notifyOnAlert,
        notifyOnMemberJoin,
        notifyOnMemberLeave,
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : '설정 저장에 실패했습니다');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-card border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">팀 알림 설정</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 본문 */}
              <div className="p-4 space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* 알림 채널 설정 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">알림 채널</h3>

                      {/* 이메일 알림 토글 */}
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">이메일 알림</p>
                            <p className="text-xs text-muted-foreground">
                              모든 팀 멤버에게 이메일 발송
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={emailNotifications}
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            emailNotifications ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              emailNotifications ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>

                      {/* Slack 웹훅 URL */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Slack 알림</p>
                            <p className="text-xs text-muted-foreground">
                              Slack 웹훅 URL을 입력하세요
                            </p>
                          </div>
                        </div>
                        <input
                          type="url"
                          value={slackWebhookUrl}
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                          placeholder="https://hooks.slack.com/services/..."
                          className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* 알림 대상 설정 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">알림 대상</h3>

                      {/* 시스템 경고 알림 */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnAlert}
                          onChange={(e) => setNotifyOnAlert(e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <div>
                          <p className="font-medium">시스템 경고 알림</p>
                          <p className="text-xs text-muted-foreground">
                            CPU, 메모리, 디스크 등 임계값 초과 시
                          </p>
                        </div>
                      </label>

                      {/* 멤버 가입 알림 */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnMemberJoin}
                          onChange={(e) => setNotifyOnMemberJoin(e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <UserPlus className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-medium">멤버 가입 알림</p>
                          <p className="text-xs text-muted-foreground">
                            새 멤버가 팀에 가입했을 때
                          </p>
                        </div>
                      </label>

                      {/* 멤버 탈퇴 알림 */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnMemberLeave}
                          onChange={(e) => setNotifyOnMemberLeave(e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <UserMinus className="w-5 h-5 text-destructive" />
                        <div>
                          <p className="font-medium">멤버 탈퇴 알림</p>
                          <p className="text-xs text-muted-foreground">
                            멤버가 팀을 나갔을 때
                          </p>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* 푸터 */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateSettings.isPending || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {updateSettings.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>저장</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
