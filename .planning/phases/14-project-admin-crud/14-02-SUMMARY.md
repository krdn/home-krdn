---
phase: 14-project-admin-crud
plan: 02
subsystem: project-scanner
tags: [project-management, file-system, import, api, admin-ui, metadata-extraction]

# Dependency graph
requires:
  - phase: 14-01
    provides: [Project CRUD API, Admin Projects Page, ProjectForm component]
provides:
  - 프로젝트 스캔 서비스 (scanProjects, isPathAllowed, getAllowedBasePaths)
  - 스캔 API (/api/projects/scan)
  - 임포트 API (/api/projects/import) with 메타데이터 자동 추출
  - Admin 스캔 탭 (ProjectScanner 컴포넌트)
  - 공개 페이지 API 연동
  - data/projects.json 데이터 저장소
  - Services 자동 연동 (createServiceFromProject)
affects: [project-management, admin-ui, public-pages, services-integration]

# Tech tracking
tech-stack:
  added: [server-only]
  patterns:
    - Server-only Node.js file system operations
    - Package.json dependency parsing → TechStack mapping
    - Git config parsing for remote URL extraction
    - Git log parsing for first commit date (startDate)
    - README.md parsing for features and demo URL
    - Category inference from folder path

key-files:
  created:
    - src/lib/project-scanner.ts
    - src/app/api/projects/scan/route.ts
    - src/app/api/projects/import/route.ts
    - src/components/admin/ProjectScanner.tsx
    - data/projects.json
  modified:
    - src/lib/projects.ts (JSON file-based CRUD)
    - src/app/admin/projects/page.tsx (탭 UI 추가)
    - src/app/projects/page.tsx (API 연동)

key-decisions:
  - "허용된 경로: /home/gon/projects, /data/home-data/projects"
  - "프로젝트 감지 기준: package.json 또는 .git 존재"
  - "카테고리 추론: 상위 폴더명 (ai, web, n8n → automation, infra)"
  - "TECH_STACK_MAP: 70+ 패키지 → 기술스택 매핑"
  - "README features 추출: 다양한 헤더 패턴 지원 (Features, 주요 기능, 핵심 기능 등)"
  - "Services 자동 등록: 프로젝트 임포트 시 연동"

patterns-established:
  - "경로 화이트리스트: isPathAllowed() 함수로 보안 검증"
  - "메타데이터 폴백: package.json > README > 폴더명 순"
  - "선택적 임포트: 개별 또는 일괄 등록 지원"
  - "Dynamic Import: 대용량 컴포넌트 지연 로딩"

issues-created: []

# Metrics
duration: 60min (estimated, completed in previous session)
completed: 2026-01-18
---

# Phase 14-02: Project Folder Scanner Summary

**파일시스템에서 개발 프로젝트를 스캔하여 메타데이터 자동 추출 및 선택적 등록 기능 구현**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-01-18
- **Completed:** 2026-01-18
- **Tasks:** 6
- **Files created:** 5
- **Files modified:** 3

## Accomplishments

### 1. 프로젝트 스캔 서비스

| 함수 | 설명 |
|------|------|
| `scanProjects(basePath, maxDepth)` | 지정 경로에서 프로젝트 탐색 |
| `isPathAllowed(path)` | 경로 화이트리스트 검증 |
| `getAllowedBasePaths()` | 허용된 기본 경로 목록 |
| `inferCategory(path)` | 폴더 구조에서 카테고리 추론 |
| `generateSlug(name)` | 슬러그 자동 생성 |

### 2. 스캔 API

```
GET /api/projects/scan
GET /api/projects/scan?basePath=/home/gon/projects&maxDepth=3
```

**응답:**
```json
{
  "success": true,
  "projects": [...],
  "total": 15,
  "registered": 7,
  "unregistered": 8
}
```

### 3. 임포트 API (메타데이터 자동 추출)

```
POST /api/projects/import
Body: { "path": "/home/gon/projects/ai/my-project" }
```

**자동 추출 정보:**
- **package.json:** name, description, dependencies → techStack
- **.git:** remote URL → GitHub 링크, 첫 커밋 → startDate
- **README.md:** 첫 단락 → description, Features 섹션 → features[], Demo URL

### 4. 기술 스택 매핑 (70+ 패키지)

| 카테고리 | 패키지 예시 |
|----------|-------------|
| Frontend | next, react, vue, svelte, tailwindcss |
| Backend | express, fastify, hono |
| Database | prisma, drizzle-orm, pg, redis |
| AI/ML | @anthropic-ai/sdk, openai, langchain |
| Testing | vitest, jest, playwright, cypress |
| UI | @radix-ui, lucide-react |

### 5. Admin 스캐너 UI

- **탭 구조:** "프로젝트 목록" | "폴더에서 가져오기"
- **스캔 결과:** 체크박스 선택, 등록/미등록 상태 표시
- **메타데이터 아이콘:** package.json, Git, README 존재 표시
- **일괄 등록:** 선택된 프로젝트 한번에 등록

### 6. 공개 페이지 API 연동

- `/projects` 페이지가 `/api/projects` 호출
- 로딩/에러 상태 처리
- 필터링 및 검색 기능 유지

## Files Created

| 파일 | 설명 |
|------|------|
| `src/lib/project-scanner.ts` | 프로젝트 스캔 서비스 |
| `src/app/api/projects/scan/route.ts` | 스캔 API 엔드포인트 |
| `src/app/api/projects/import/route.ts` | 임포트 API (863줄) |
| `src/components/admin/ProjectScanner.tsx` | 스캐너 UI 컴포넌트 |
| `data/projects.json` | 프로젝트 데이터 저장소 |

## Files Modified

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/projects.ts` | JSON 파일 기반 CRUD 함수 |
| `src/app/admin/projects/page.tsx` | 탭 UI 추가, Dynamic Import |
| `src/app/projects/page.tsx` | API fetch 연동 |

## Architecture Decisions

### 경로 보안
```typescript
const ALLOWED_BASE_PATHS = [
  "/home/gon/projects",
  "/data/home-data/projects",
];

// 경로 탈출 방지
if (targetPath.includes("..")) return false;
```

### 메타데이터 추출 우선순위
```
1. overrides (사용자 입력)
2. package.json (name, description)
3. README.md (description, features)
4. 폴더명 (slug, name 폴백)
```

### README Features 추출 패턴
```typescript
const featuresPatterns = [
  /^#{2,3}\s*(features?|주요\s*기능|기능)/i,
  /^#{2,3}\s*(what('s|\s+is)\s+|특징)/i,
  /^#{2,3}\s*(주요\s*구현|구현\s*사항|핵심\s*기능)/i,
  /^#{2,3}\s*(highlights?|key\s*features?)/i,
];
```

## Verification Results

- [x] `npm run build` 성공 ✓
- [x] `/admin/projects` → "폴더에서 가져오기" 탭 표시 ✓
- [x] 스캔 → 프로젝트 목록 표시 ✓
- [x] 개별/일괄 등록 기능 ✓
- [x] `/projects` 페이지 API 연동 ✓

## Deviations from Plan

None - 계획대로 구현 완료

## Next Steps

- 프로젝트 상세 페이지 개선 (이미지 갤러리)
- 프로젝트 태그 시스템 추가
- README 변경 시 자동 동기화

---
*Phase: 14-project-admin-crud*
*Plan: 02 - Project Folder Scanner*
*Completed: 2026-01-18*
