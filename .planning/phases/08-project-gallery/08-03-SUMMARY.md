---
phase: 08-project-gallery
plan: 03
type: summary
status: completed
completed_at: 2026-01-14
---

# 08-03 이미지/미디어 최적화 완료

## 완료 내용

### Task 1: 이미지 유틸리티 함수 생성

**파일**: `src/lib/imageUtils.ts`

이미지 처리를 위한 유틸리티 함수 모음을 생성했습니다:

- `getShimmerDataUrl()`: shimmer 효과 SVG를 base64로 인코딩하여 blurDataURL로 사용
- `getCategoryShimmerDataUrl()`: 카테고리별 색상이 적용된 shimmer 효과
- `getPlaceholderImage()`: 텍스트가 포함된 플레이스홀더 이미지 URL 생성
- `getCategoryPlaceholder()`: 카테고리별 아이콘과 색상이 적용된 플레이스홀더
- `getDefaultProjectImage()`: 카테고리별 기본 프로젝트 이미지 경로
- `getAspectRatio()`: 이미지 종횡비 계산
- `getResponsiveSizes()`: 반응형 sizes 속성 생성
- `imageLoader()`: Next.js Image 커스텀 로더
- `isValidImageUrl()`: 이미지 URL 유효성 검사
- `getProjectImagePath()`: 프로젝트 슬러그로 이미지 경로 생성

### Task 2: ProjectImage 컴포넌트 구현

**파일**: `src/components/projects/ProjectImage.tsx`

최적화된 이미지 표시를 위한 두 가지 컴포넌트를 구현했습니다:

#### ProjectImage
- Next.js Image 컴포넌트 래퍼
- 로딩 중 shimmer 효과 (blurDataURL)
- 이미지 로드 실패 시 카테고리별 플레이스홀더 표시
- 반응형 sizes 속성 자동 설정
- lazy loading 기본 적용
- React.memo로 최적화

**Props:**
```typescript
interface ProjectImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fallbackCategory?: ProjectCategory;
  fill?: boolean;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  aspectRatio?: string;
  showShimmer?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}
```

#### ProjectImageGallery
- 여러 이미지를 그리드 형태로 표시
- 메인 이미지 + 추가 이미지 레이아웃
- 이미지 없을 때 플레이스홀더 자동 표시
- 그리드 열 수 커스터마이징 가능

### Task 3: 프로젝트 이미지 디렉토리 설정

**디렉토리**: `public/images/projects/`

- `.gitkeep` 파일로 디렉토리 유지
- 카테고리별 기본 이미지 SVG 파일 생성:
  - `default-web.svg` - 웹 프로젝트용 (파란색)
  - `default-automation.svg` - 자동화 프로젝트용 (오렌지색)
  - `default-ai.svg` - AI 프로젝트용 (보라색)
  - `default-infra.svg` - 인프라 프로젝트용 (녹색)
  - `default-other.svg` - 기타 프로젝트용 (회색)

**이미지 네이밍 컨벤션:**
- `/images/projects/{slug}/main.png` - 메인 이미지
- `/images/projects/{slug}/screenshot-{n}.png` - 스크린샷

## 검증 결과

- [x] `npm run build` 성공
- [x] 이미지 로딩 시 shimmer 효과 구현
- [x] 이미지 로드 실패 시 플레이스홀더 표시
- [x] `public/images/projects/` 디렉토리 존재
- [x] 카테고리별 기본 이미지 SVG 생성

## 생성된 파일

| 파일 | 설명 |
|------|------|
| `src/lib/imageUtils.ts` | 이미지 유틸리티 함수 |
| `src/components/projects/ProjectImage.tsx` | 최적화된 이미지 컴포넌트 |
| `public/images/projects/.gitkeep` | 이미지 디렉토리 유지 |
| `public/images/projects/default-web.svg` | 웹 카테고리 기본 이미지 |
| `public/images/projects/default-automation.svg` | 자동화 카테고리 기본 이미지 |
| `public/images/projects/default-ai.svg` | AI 카테고리 기본 이미지 |
| `public/images/projects/default-infra.svg` | 인프라 카테고리 기본 이미지 |
| `public/images/projects/default-other.svg` | 기타 카테고리 기본 이미지 |

## 사용 예시

```tsx
import { ProjectImage, ProjectImageGallery } from '@/components/projects/ProjectImage';

// 단일 이미지
<ProjectImage
  src="/images/projects/my-project/main.png"
  alt="My Project Screenshot"
  width={800}
  height={600}
  fallbackCategory="web"
/>

// 이미지 갤러리
<ProjectImageGallery
  images={project.images}
  category={project.category}
  columns={2}
  aspectRatio="16/9"
/>
```

## 다음 단계

- 08-04: ProjectCard 컴포넌트 구현
- 08-05: 프로젝트 목록 페이지 구현
