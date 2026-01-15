/**
 * 포커스 트랩 훅
 *
 * Phase 28: Accessibility Enhancement
 *
 * 모달 및 다이얼로그에서 포커스를 내부로 제한하고,
 * 닫힐 때 이전 포커스 위치를 복원합니다.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// 포커스 가능한 요소 셀렉터
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * 모달/다이얼로그에서 포커스를 내부로 제한하는 훅
 *
 * @param isActive - 포커스 트랩 활성화 여부
 * @returns 컨테이너에 연결할 ref
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
 *
 *   return isOpen ? (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button>First focusable</button>
 *       <button>Last focusable</button>
 *     </div>
 *   ) : null;
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean = true) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 포커스 가능한 요소 목록 가져오기
  const getFocusableElements = useCallback(() => {
    const container = containerRef.current;
    if (!container) return [];

    return Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => {
      // 실제로 보이는 요소만 필터링
      return el.offsetParent !== null;
    });
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // 현재 포커스된 요소 저장 (복원용)
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // 약간의 딜레이 후 첫 번째 요소로 포커스
    // (애니메이션 완료 대기)
    const focusTimer = setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 50);

    // Tab 키 트랩 핸들러
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: 첫 번째 요소에서 마지막으로 순환
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 마지막 요소에서 첫 번째로 순환
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      // 포커스 복원
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, getFocusableElements]);

  return containerRef;
}

/**
 * 모션 감소 선호 감지 훅
 *
 * @returns 사용자가 모션 감소를 선호하는지 여부
 */
export function useReducedMotion(): boolean {
  const mediaQuery =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  const getInitialState = () => mediaQuery?.matches ?? false;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getInitialState
  );

  useEffect(() => {
    if (!mediaQuery) return;

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mediaQuery]);

  return prefersReducedMotion;
}
