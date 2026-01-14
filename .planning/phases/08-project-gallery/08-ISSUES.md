# UAT Issues: Phase 8 Project Gallery

**Tested:** 2026-01-14
**Source:** .planning/phases/08-project-gallery/08-0[1-3]-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - All issues resolved]

## Resolved Issues

### UAT-001: 프로젝트 이미지 깨짐
**Resolved:** 2026-01-14 - Fixed in ProjectCard.tsx
**Commit:** (pending)

**Discovered:** 2026-01-14
**Phase/Plan:** 08-02, 08-03
**Severity:** Minor
**Feature:** 프로젝트 이미지 표시
**Description:** 프로젝트 카드와 상세 페이지에서 깨진 이미지 아이콘이 표시됨. fallback 이미지가 제대로 동작하지 않음.
**Fix:** ProjectCard.tsx에서 직접 next/image 사용 대신 ProjectImage 컴포넌트로 교체하여 fallback 로직 적용

### UAT-002: 카드 전체 클릭 비활성화 (UX)
**Resolved:** 2026-01-14 - Fixed in ProjectCard.tsx
**Commit:** (pending)

**Discovered:** 2026-01-14
**Phase/Plan:** 08-02
**Severity:** Cosmetic
**Feature:** 프로젝트 카드 네비게이션
**Description:** 프로젝트 카드 전체를 클릭해도 상세 페이지로 이동하지 않고, "상세 보기" 버튼만 클릭 가능
**Fix:** 카드 전체를 Link로 감싸고, 외부 링크 버튼은 stopPropagation으로 이벤트 버블링 방지

---

*Phase: 08-project-gallery*
*Tested: 2026-01-14*
