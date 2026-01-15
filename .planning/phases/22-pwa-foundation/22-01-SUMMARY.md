# Phase 22-01: PWA Foundation Summary

**PWA 기본 인프라 구축 완료 - 앱 설치 및 기본 캐싱 지원**

## Accomplishments

- PWA Manifest 구현 (Next.js 16 내장 기능 활용)
- PWA 아이콘 생성 (192x192, 512x512 PNG)
- Service Worker 기본 캐싱 전략 구현
- 설치 프롬프트 UI 구현

## Files Created/Modified

### Created
- `src/app/manifest.ts` - PWA 웹 매니페스트
- `public/sw.js` - Service Worker (기본 캐싱)
- `public/icons/icon.svg` - 소스 아이콘
- `public/icons/icon-192x192.png` - PWA 아이콘 (small)
- `public/icons/icon-512x512.png` - PWA 아이콘 (large)
- `src/components/pwa/ServiceWorkerRegister.tsx` - SW 등록 컴포넌트
- `src/components/pwa/InstallPrompt.tsx` - 설치 프롬프트 UI
- `src/components/pwa/index.ts` - 배럴 파일
- `src/hooks/usePWAInstall.ts` - PWA 설치 훅

### Modified
- `src/app/layout.tsx` - PWA 메타데이터 + 컴포넌트 통합
- `next.config.ts` - Service Worker 헤더 설정

## Decisions Made

1. **next-pwa 미사용**: deprecated된 next-pwa 대신 직접 sw.js 작성 (Next.js 공식 권장)
2. **캐싱 전략**:
   - API: Network-first (항상 최신 데이터 우선)
   - 정적 자산: Cache-first (속도 우선)
3. **viewport export 분리**: Next.js 16에서 themeColor/viewport가 별도 export로 분리됨
4. **maskable 아이콘**: purpose를 'any'와 'maskable'로 분리 (타입 호환성)

## Issues Encountered

1. **TypeScript 타입 오류**: `purpose: 'any maskable'`이 허용되지 않음
   - 해결: 아이콘을 두 개씩 분리 (purpose: 'any', purpose: 'maskable')

2. **viewport/themeColor 경고**: Next.js 16에서 metadata에서 분리됨
   - 해결: `export const viewport: Viewport` 별도 export 추가

## Next Phase Readiness

Phase 22-01 complete. Phase 23 (Push Notification) 준비 완료.
- Service Worker에 push 이벤트 핸들러 이미 포함됨
- VAPID 키 설정 및 구독 관리 구현 필요
