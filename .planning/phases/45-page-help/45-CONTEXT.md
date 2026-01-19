# Phase 45: Page Help - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

15개 주요 페이지에 도움말 아이콘을 배치하고, 각 페이지의 기능을 설명하는 한국어 콘텐츠를 작성합니다. Phase 44에서 구현한 HelpButton/HelpModal 인프라를 활용합니다. 새로운 페이지 추가나 기능 확장은 이 phase의 범위가 아닙니다.

</domain>

<decisions>
## Implementation Decisions

### 아이콘 배치 위치
- 페이지 타이틀 옆에 도움말 버튼 배치
- 타이틀과 아이콘의 정렬 방식: Claude 재량 (기존 UI 패턴에 맞게)
- 타이틀이 없는 페이지(대시보드 홈 등): Claude 재량 (적합한 위치 선택)
- 버튼 스타일: Claude 재량 (Phase 44 HelpButton 또는 변형)

### 콘텐츠 깊이와 형식
- 깊이: 중간 수준 (페이지 목적, 주요 기능, 간단한 사용법)
- 시각적 요소: 텍스트 + 아이콘/이모지(💡, ⚠️) 활용 (스크린샷 미포함)
- 문체: 간결한 설명체 ("주요 기능: A, B, C" 스타일)
- 외부 링크: Claude 재량 (필요시 내부 페이지 링크만)

### 콘텐츠 구조
- 필수 섹션: 목적 + 주요 기능
- FAQ/문제 해결: 포함하지 않음 (간결하게 유지)
- 관련 페이지 안내: 포함 ("설정은 Admin > Settings에서" 형태)
- 길이 제한: 없음 (필요한 만큼 작성)

### 작성 우선순위 및 플랜 구성
- Public 페이지 먼저, 그 다음 Admin 페이지
- 2개 플랜으로 구성:
  - Plan 1: Public 페이지 5개 (/, /services, /projects, /ports, /teams)
  - Plan 2: Admin 페이지 10개 (/admin, /admin/containers, /admin/alerts, /admin/settings, /admin/github, /admin/logs, /admin/log-alerts, /admin/kubernetes, /admin/devops, /admin/ports)

### Claude's Discretion
- 타이틀과 아이콘의 정렬 방식 (기존 패턴에 맞게)
- 타이틀 없는 페이지의 아이콘 위치
- HelpButton 스타일 선택/변형
- 내부 페이지 링크 포함 여부

</decisions>

<specifics>
## Specific Ideas

- 문체: "주요 기능: A, B, C" 형태의 간결한 설명체 사용
- 이모지: 💡 (팁), ⚠️ (주의), ✅ (체크) 등으로 시각적 강조
- 관련 안내: "자세한 설정은 Admin > Settings에서 변경할 수 있습니다" 형태

</specifics>

<deferred>
## Deferred Ideas

None — 논의가 phase 범위 내에서 진행됨

</deferred>

---

*Phase: 45-page-help*
*Context gathered: 2026-01-19*
