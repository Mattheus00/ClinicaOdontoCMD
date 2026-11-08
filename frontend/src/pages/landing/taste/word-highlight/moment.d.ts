import type * as library from "../lib.js";

export const phone: true;
export default function mount(
  root: HTMLElement,
  options: { from?: number; to?: number },
  lib: typeof library,
): { destroy?: () => void };
