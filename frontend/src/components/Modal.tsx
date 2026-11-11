import { type ReactNode, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
  /** When true, backdrop/Esc ask before closing. */
  isDirty?: boolean;
  discardTitle?: string;
  discardMessage?: string;
};

export function Modal({
  title,
  children,
  footer,
  onClose,
  className = '',
  isDirty = false,
  discardTitle = 'Descartar alterações?',
  discardMessage = 'Você tem alterações não salvas. Deseja descartá-las?',
}: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const requestClose = useEffectEvent(() => {
    if (isDirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  });

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const focusables = dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.classList.contains('modal-close-btn') && el.getAttribute('aria-label') !== 'Fechar',
        )
      : [];
    const preferred =
      focusables.find((el) => {
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.getAttribute('contenteditable') === 'true';
      }) ?? focusables[0] ?? dialog;
    preferred?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[data-app-modal]');
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmDiscard) {
          setConfirmDiscard(false);
          return;
        }
        requestClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.getClientRects().length > 0,
      );
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [confirmDiscard]);

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={requestClose}>
      <section
        ref={dialogRef}
        data-app-modal
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button modal-close-btn" aria-label="Fechar" onClick={requestClose}>
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer}
      </section>

      {confirmDiscard ? (
        <div
          className="modal-backdrop modal-discard-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            event.stopPropagation();
            setConfirmDiscard(false);
          }}
        >
          <section
            className="modal confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-discard`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <h2 id={`${titleId}-discard`}>{discardTitle}</h2>
            </header>
            <div className="modal-body">
              <p>{discardMessage}</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDiscard(false)}>
                Continuar editando
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setConfirmDiscard(false);
                  onClose();
                }}
              >
                Descartar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
