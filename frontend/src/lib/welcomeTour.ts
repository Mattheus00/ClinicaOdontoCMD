export const OPEN_TOUR_EVENT = 'app:open-tour';

export const tourStorageKey = (userId: string) => `maria-alice:tour-done:${userId}`;

export function openWelcomeTour() {
  window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
}
