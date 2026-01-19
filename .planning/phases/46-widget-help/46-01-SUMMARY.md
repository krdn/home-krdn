---
phase: 46
plan: 01
subsystem: help-system
tags: [help, widgets, dashboard, ports, HelpButton]
requires:
  - phase-44 (Help Infrastructure)
  - phase-45 (Page Help)
provides:
  - Dashboard 위젯 도움말 (SystemMonitor, ContainerStats, NetworkAreaChart, MetricsLineChart)
  - Port 위젯 도움말 (PortScanner, PortComparison, PortGuide)
affects:
  - phase-46-02 (추가 위젯 도움말)
tech-stack:
  added: []
  patterns:
    - HelpButton widget integration pattern
    - 위젯 헤더 flex layout with help button
key-files:
  created: []
  modified:
    - src/types/help.ts
    - src/data/help/index.ts
    - src/components/admin/SystemMonitor.tsx
    - src/components/admin/ContainerStats.tsx
    - src/components/charts/NetworkAreaChart.tsx
    - src/components/charts/MetricsLineChart.tsx
    - src/components/ports/PortScanner.tsx
    - src/components/ports/PortComparison.tsx
    - src/components/ports/PortGuide.tsx
decisions:
  - id: widget-help-placement
    decision: 위젯 타이틀 옆에 HelpButton size="sm" 배치
    rationale: 위젯 정보 밀도 유지, 일관된 UX
metrics:
  duration: ~8min
  completed: 2026-01-19
---

# Phase 46 Plan 01: Dashboard/Port 위젯 도움말 Summary

Dashboard 및 Port 위젯 7개에 한국어 도움말 버튼 및 상세 콘텐츠 추가

## What Was Done

### Task 1: WidgetHelpId 타입 확장 및 도움말 콘텐츠 작성

**WidgetHelpId 타입 확장 (src/types/help.ts):**
- 새 위젯 ID 추가: `widget-network-chart`, `widget-process-chart`
- Port 위젯 ID 추가: `widget-port-scanner`, `widget-port-comparison`, `widget-port-guide`
- Phase 46-02용 placeholder ID 추가 (Admin/DevOps/Team 위젯)

**도움말 콘텐츠 작성 (src/data/help/index.ts):**

| Widget | 제목 | 주요 내용 |
|--------|------|----------|
| widget-system-monitor | 시스템 모니터 | CPU/메모리/디스크 지표, 상태 색상 (녹/파/노/빨) |
| widget-container-stats | 컨테이너 통계 | Running/Stopped/Total, Progress Bar 설명 |
| widget-network-chart | 네트워크 트래픽 | RX/TX Area Chart, 그래프 읽기 가이드 |
| widget-process-chart | 프로세스 메트릭 | CPU/Memory Line Chart, 추세 분석 팁 |
| widget-port-scanner | 포트 스캐너 | Docker/시스템 포트 스캔, 테이블 컬럼 설명 |
| widget-port-comparison | 포트 비교 | 정상/주의/미등록 비교 결과 설명 |
| widget-port-guide | 포트 가이드 | 포트 범위 안내, 카테고리별 사용률 설명 |

### Task 2: 7개 위젯에 HelpButton 배치

| 컴포넌트 | 위치 | HelpId |
|----------|------|--------|
| SystemMonitor.tsx | System Information CardTitle 옆 | widget-system-monitor |
| ContainerStats.tsx | Containers CardTitle 옆 | widget-container-stats |
| NetworkAreaChart.tsx | 차트 타이틀 옆 (flex row) | widget-network-chart |
| MetricsLineChart.tsx | 차트 타이틀 옆 (flex row) | widget-process-chart |
| PortScanner.tsx | 포트 스캐너 h2 옆 | widget-port-scanner |
| PortComparison.tsx | 포트 비교 h2 옆 | widget-port-comparison |
| PortGuide.tsx | 포트 가이드 h2 옆 | widget-port-guide |

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 64d3cf4 | feat | WidgetHelpId 확장 및 위젯 도움말 콘텐츠 작성 |
| a4e9709 | feat | Dashboard/Port 위젯 7개에 HelpButton 배치 |

## Decisions Made

1. **HelpButton 배치 패턴**: 위젯 타이틀 요소 바로 옆에 `flex items-center gap-2` 레이아웃으로 배치
2. **size="sm" 사용**: 위젯은 정보 밀도가 높으므로 작은 크기의 도움말 버튼 사용
3. **차트 컴포넌트 처리**: h3 타이틀을 div로 감싸고 flex row로 변경

## Deviations from Plan

### Linter 자동 추가 (예상 외)

**발생:** Task 1 실행 중 linter가 Phase 46-02용 위젯 ID들을 help.ts에 미리 추가

**대응:** helpContents에 placeholder 콘텐츠 추가하여 TypeScript 오류 해결

**추가된 placeholder ID:**
- Admin/DevOps 위젯: alert-rules, email-settings, slack-settings, log-filter, workflow-list
- K8s 위젯: k8s-pods, k8s-services, k8s-deployments, service-topology
- Team/Project/Service 위젯: team-members, team-settings, project-card, service-card

## Verification Results

- [x] TypeScript 컴파일 성공 (help 관련 오류 없음)
- [x] npm run build 성공
- [x] 7개 위젯에 HelpButton 배치 확인
- [x] helpContents에 7개 위젯 콘텐츠 존재 확인

## Next Phase Readiness

**Ready for:** Phase 46-02 (추가 위젯 도움말)
- Admin/DevOps 위젯 도움말 상세화
- Team/Project/Service 위젯 도움말 상세화

**Blockers:** None
