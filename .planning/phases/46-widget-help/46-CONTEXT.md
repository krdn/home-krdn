# Phase 46: Widget Help - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

각 위젯/카드/영역에 상세 도움말 아이콘 배치 및 콘텐츠 작성. 15개 위젯 그룹 전체에 도움말 시스템 적용. Phase 44에서 구축한 HelpButton/HelpModal 인프라를 활용하여 위젯별 도움말 제공.

</domain>

<decisions>
## Implementation Decisions

### 도움말 배치 위치
- 위젯 헤더 오른쪽에 도움말 아이콘 배치 (페이지 도움말과 동일한 패턴)
- 헤더가 없는 위젯(단독 카드, 상태 배지)은 카드 우상단 코너에 배치
- 아이콘 크기는 페이지 도움말과 동일 (16px)
- 여러 항목이 있는 위젯(SystemMonitor: CPU, Memory, Disk, Uptime)은 위젯 단위 통합 도움말로 구성

### 콘텐츠 깊이
- 상세 수준 (4-6 문단): 기능 설명 + 상태 의미 + 사용 팁
- 문제 해결 가이드(Troubleshooting) 포함: "이런 경우에는..." 형식
- 관련 설정 페이지 링크 안내 포함: "설정 변경은 /admin/settings에서..."
- 텍스트 기반 설명만 (이미지/스크린샷 제외)

### 위젯 그룹화 (Plan 분리)
- **Plan 1: 모니터링 + 알림 위젯**
  - SystemMonitor (CPU, Memory, Disk, Uptime)
  - ContainerStats
  - NetworkAreaChart
  - MetricsLineChart (Process)
  - AlertRulesPanel
  - EmailSettings
  - SlackSettings

- **Plan 2: DevOps/K8s + 기타 위젯**
  - WorkflowList / WorkflowStatusBadge
  - LogFilter / LogViewer
  - K8sPodList / K8sServiceList / K8sDeploymentList
  - ServiceTopology
  - PortScanner / PortComparison / PortGuide
  - TeamMemberList / TeamSettingsPanel
  - ProjectCard / ServiceCard

### 상태/색상 설명
- 상태 색상(빨강/노랑/초록)은 표로 정리: "빨강: 위험, 노랑: 주의, 초록: 정상"
- 데이터 단위(%, GB, ms)와 정상 범위 포함: "CPU 사용률은 %로 표시, 80% 이상이면 주의"
- 차트 해석 가이드 포함: "선이 위로 가면 사용량 증가, 급격한 스파이크는 주의"
- K8s 상태별 의미 상세 설명: Running, Pending, Failed 각각의 의미와 대응 방법

### Claude's Discretion
- 위젯별 문제 해결 가이드의 구체적인 시나리오
- 차트 해석 가이드의 세부 표현
- 헤더 없는 위젯의 정확한 아이콘 위치 (우상단 내 세부 위치)

</decisions>

<specifics>
## Specific Ideas

- 페이지 도움말과 동일한 UX 패턴 유지 (HelpButton ghost 스타일, 16px 아이콘)
- 위젯 도움말은 해당 위젯의 데이터/상태를 이해하는 데 초점
- "문제가 있을 때 어떻게 해야 하는가"에 대한 실용적인 가이드 제공
- 상태 색상은 기존 시스템과 일관성 유지 (destructive/warning/success 계열)

</specifics>

<deferred>
## Deferred Ideas

None — 논의가 Phase 46 범위 내에서 진행됨

</deferred>

---

*Phase: 46-widget-help*
*Context gathered: 2026-01-19*
