/** Types for the unmodified Taste Skill helpers used by word-highlight. */
export function reduced(): boolean;
export function clamp(value: number, min?: number, max?: number): number;
export function split(element: HTMLElement, unit: "words" | "chars"): HTMLElement[];
export function scrub(
  element: HTMLElement,
  callback: (progress: number, rect: DOMRect) => void,
  options?: { mode?: "view" | "hold" },
): { destroy: () => void; update: () => void };
