# 08-01 갤러리 데이터 모델 및 API 완료 요약

**완료일시**: 2025-01-14
**상태**: Completed

## 생성된 파일

### 1. src/types/project.ts
프로젝트 갤러리용 타입 시스템 정의

- `ProjectCategory`: 프로젝트 카테고리 타입 (`web`, `automation`, `ai`, `infra`, `other`)
- `ProjectStatus`: 프로젝트 상태 타입 (`active`, `completed`, `archived`, `planned`)
- `TechStack`: 기술 스택 항목 인터페이스
- `ProjectLink`: 프로젝트 링크 인터페이스 (github, demo, docs, api, other)
- `ProjectImage`: 프로젝트 이미지 인터페이스
- `Project`: 메인 프로젝트 인터페이스
- 카테고리/상태 레이블 및 색상 상수 정의

### 2. src/config/projects.ts
프로젝트 데이터 및 유틸리티 함수

**등록된 프로젝트 (5개)**:
1. **home-krdn** (web) - 개인 홈서버 대시보드 [featured]
2. **docker-n8n** (automation) - Docker n8n 환경 구성
3. **ai-note-taking** (ai) - AI 기반 스마트 노트 작성 앱 [featured]
4. **krdn-claude** (infra) - Claude Code 기반 AI 오케스트레이터
5. **news-sentiment-analyzer** (ai) - 뉴스 감정 분석 시스템

**헬퍼 함수**:
- `getProjectById()` / `getProjectBySlug()` - ID/슬러그로 조회
- `getProjectsByCategory()` - 카테고리별 조회
- `getFeaturedProjects()` - Featured 프로젝트 조회
- `getActiveProjects()` - 활성 프로젝트 조회
- `getSortedProjects()` - 정렬된 목록 조회
- `getAllCategories()` - 모든 카테고리 목록

### 3. src/app/api/projects/route.ts
프로젝트 목록 API 엔드포인트

**엔드포인트**: `GET /api/projects`

**쿼리 파라미터** (Zod 검증):
- `category`: `web` | `automation` | `ai` | `infra` | `other` | `all`
- `status`: `active` | `completed` | `archived` | `planned` | `all`
- `featured`: `true` | `false`

**응답 형식**:
```json
{
  "success": true,
  "projects": [...],
  "total": 5,
  "categories": ["web", "automation", "ai", "infra"],
  "filters": {
    "category": "all",
    "status": "all",
    "featured": undefined
  }
}
```

## 주요 결정 사항

1. **기존 패턴 준수**: `src/types/service.ts`와 `src/config/services.ts` 패턴을 따라 일관된 구조 유지
2. **Zod 검증**: API 쿼리 파라미터에 Zod 스키마 검증 적용
3. **Order 기반 정렬**: `order` 필드가 있으면 우선 정렬, 없으면 이름순 정렬
4. **Featured 필드**: 갤러리 메인에 표시할 프로젝트 구분용
5. **이미지 구조**: `isPrimary` 플래그로 대표 이미지 지정 가능

## 검증 결과

- [x] `npm run build` 성공
- [x] TypeScript 타입 오류 없음
- [x] API 라우트 정상 등록 (`ƒ /api/projects`)

## 다음 단계

08-02: 프로젝트 갤러리 UI 컴포넌트 구현
- 프로젝트 카드 컴포넌트
- 갤러리 그리드 레이아웃
- 필터링 UI
