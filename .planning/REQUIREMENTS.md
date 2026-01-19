# Requirements: Home-KRDN v2.4 Help System

**Defined:** 2026-01-19
**Core Value:** 사용자가 모든 기능을 쉽게 이해하고 활용할 수 있는 상세한 도움말 시스템

## v1 Requirements

### Infrastructure (인프라)

- [ ] **INFRA-01**: HelpButton 컴포넌트 구현 (? 아이콘, 클릭 시 모달 열기)
- [ ] **INFRA-02**: HelpModal 컴포넌트 구현 (제목, 본문, 닫기 버튼)
- [ ] **INFRA-03**: 도움말 콘텐츠 저장소 구조 정의 (TypeScript 객체, helpId 기반)
- [ ] **INFRA-04**: 도움말 컨텍스트/훅 구현 (useHelp)

### Page Help (페이지 도움말)

- [ ] **PAGE-01**: 메인 대시보드 (/) 페이지 도움말
- [ ] **PAGE-02**: 서비스 카탈로그 (/services) 페이지 도움말
- [ ] **PAGE-03**: 프로젝트 갤러리 (/projects) 페이지 도움말
- [ ] **PAGE-04**: 포트 레지스트리 (/ports) 페이지 도움말
- [ ] **PAGE-05**: 팀 관리 (/teams) 페이지 도움말
- [ ] **PAGE-06**: Admin 대시보드 (/admin) 페이지 도움말
- [ ] **PAGE-07**: 컨테이너 관리 (/admin/containers) 페이지 도움말
- [ ] **PAGE-08**: 알림 설정 (/admin/alerts) 페이지 도움말
- [ ] **PAGE-09**: 설정 (/admin/settings) 페이지 도움말
- [ ] **PAGE-10**: GitHub CI/CD (/admin/github) 페이지 도움말
- [ ] **PAGE-11**: 로그 뷰어 (/admin/logs) 페이지 도움말
- [ ] **PAGE-12**: 로그 알림 (/admin/log-alerts) 페이지 도움말
- [ ] **PAGE-13**: Kubernetes (/admin/kubernetes) 페이지 도움말
- [ ] **PAGE-14**: DevOps 홈 (/admin/devops) 페이지 도움말
- [ ] **PAGE-15**: 포트 관리 (/admin/ports) 페이지 도움말

### Widget Help (위젯 도움말)

- [ ] **WIDGET-01**: 시스템 메트릭 카드 (CPU, 메모리, 디스크, 업타임) 도움말
- [ ] **WIDGET-02**: 컨테이너 상태 카드 도움말
- [ ] **WIDGET-03**: 네트워크 차트 도움말
- [ ] **WIDGET-04**: 프로세스 차트 도움말
- [ ] **WIDGET-05**: 알림 규칙 설정 영역 도움말
- [ ] **WIDGET-06**: 이메일/Slack 알림 채널 설정 도움말
- [ ] **WIDGET-07**: 로그 필터 및 검색 도움말
- [ ] **WIDGET-08**: GitHub 워크플로우 상태 도움말
- [ ] **WIDGET-09**: K8s Pod/Service/Deployment 목록 도움말
- [ ] **WIDGET-10**: 서비스 토폴로지 시각화 도움말
- [ ] **WIDGET-11**: 포트 스캐너 도움말
- [ ] **WIDGET-12**: 포트 비교 분석 도움말
- [ ] **WIDGET-13**: 포트 가이드 도움말
- [ ] **WIDGET-14**: 팀 멤버 관리 도움말
- [ ] **WIDGET-15**: 프로젝트/서비스 카드 도움말

### Content (콘텐츠 품질)

- [ ] **CONT-01**: 모든 도움말 한국어로 작성
- [ ] **CONT-02**: 기능 설명 + 상태 표시 의미 + 관련 설정 안내 포함
- [ ] **CONT-03**: 도움말 콘텐츠 파일 구조화 (카테고리별 분리)

## v2 Requirements

### 향후 개선

- **FUTURE-01**: 도움말 검색 기능
- **FUTURE-02**: 도움말 내 키워드 하이라이트
- **FUTURE-03**: 관련 도움말 링크 연결
- **FUTURE-04**: 도움말 피드백 (도움이 됐나요?)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 다국어 지원 | 현재 한국어만 사용, 나중에 확장 가능 |
| 비디오/GIF 튜토리얼 | 콘텐츠 관리 복잡도, 텍스트로 충분 |
| 인터랙티브 투어 | 별도 라이브러리 필요, v2.5+ 고려 |
| 외부 문서 링크 | 내부 도움말로 완결성 유지 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 44 | Pending |
| INFRA-02 | Phase 44 | Pending |
| INFRA-03 | Phase 44 | Pending |
| INFRA-04 | Phase 44 | Pending |
| PAGE-01 ~ PAGE-15 | Phase 45 | Pending |
| WIDGET-01 ~ WIDGET-15 | Phase 46 | Pending |
| CONT-01 ~ CONT-03 | Phase 45-46 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*
