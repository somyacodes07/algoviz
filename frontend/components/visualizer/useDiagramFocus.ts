import { useEffect, type RefObject } from 'react';

/** Keep the structure's active item visible within its own scroll viewport. */
export function useDiagramFocus<T extends HTMLElement>(ref: RefObject<T | null>, focusKey: unknown): void {
  useEffect(() => {
    const viewport = ref.current;
    const activeItem = viewport?.querySelector<SVGElement | HTMLElement>('[data-diagram-active="true"]');
    if (!activeItem) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeItem.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [focusKey, ref]);
}
