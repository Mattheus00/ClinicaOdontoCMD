type FeedbackTone = 'error' | 'info' | 'success';

function dispatchToast(message: string, tone: FeedbackTone) {
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { message, tone },
    }),
  );
}

export function notifySuccess(message: string) {
  dispatchToast(message, 'success');
}

export function notifyError(message: string) {
  dispatchToast(message, 'error');
}

export function notifyInfo(message: string) {
  dispatchToast(message, 'info');
}

/** Clear matching toasts by re-dispatching a replace signal (AppFeedback keeps stacking; callers should avoid duplicates via skipGlobalError). */
export function notifyClearErrors() {
  window.dispatchEvent(new CustomEvent('app:toast-clear-errors'));
}
