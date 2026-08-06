import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useClearStaffNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useStaffNotifications,
} from '../features/notifications/api';
import './StaffNotificationBell.css';

function formatWhen(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function clinicDateKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

type PanelCoords = { top: number; left: number; width: number; maxHeight: number };

export default function StaffNotificationBell({ enabled = true }: { enabled?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [panelCoords, setPanelCoords] = useState<PanelCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousUnread = useRef<number | null>(null);
  const notifications = useStaffNotifications(enabled);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearStaffNotifications();

  const unreadCount = notifications.data?.unreadCount ?? 0;
  const items = notifications.data?.items ?? [];

  useEffect(() => {
    if (!enabled) return;
    if (previousUnread.current === null) {
      previousUnread.current = unreadCount;
      return;
    }
    if (unreadCount > previousUnread.current) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message: 'Nova solicitação de agendamento recebida.' },
        }),
      );
    }
    previousUnread.current = unreadCount;
  }, [enabled, unreadCount]);

  useEffect(() => {
    if (!open) {
      setPanelCoords(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gutter = 12;
      const preferredWidth = Math.min(340, window.innerWidth - gutter * 2);
      // Prefer aligning with the trigger; clamp into the viewport.
      let left = rect.left;
      if (left + preferredWidth > window.innerWidth - gutter) {
        left = Math.max(gutter, window.innerWidth - gutter - preferredWidth);
      }
      const spaceBelow = window.innerHeight - rect.bottom - gutter - 8;
      const spaceAbove = rect.top - gutter - 8;
      const openBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;
      const maxHeight = Math.min(420, Math.max(160, openBelow ? spaceBelow : spaceAbove));
      const top = openBelow
        ? rect.bottom + 8
        : Math.max(gutter, rect.top - 8 - maxHeight);
      setPanelCoords({ top, left, width: preferredWidth, maxHeight });
    };

    updatePosition();

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus();
    });
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  if (!enabled) return null;

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`staff-bell-panel${panelCoords ? ' is-positioned' : ''}`}
            role="dialog"
            aria-label="Notificações"
            ref={panelRef}
            style={
              panelCoords
                ? {
                    top: panelCoords.top,
                    left: panelCoords.left,
                    width: panelCoords.width,
                    maxHeight: panelCoords.maxHeight,
                    right: 'auto',
                    maxWidth: 'none',
                  }
                : undefined
            }
          >
            <header className="staff-bell-panel-head">
              <strong>Solicitações</strong>
              <div className="staff-bell-panel-actions">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={markAllRead.isPending || clearAll.isPending}
                    onClick={() => markAllRead.mutate()}
                  >
                    Marcar todas
                  </button>
                ) : null}
                {items.length > 0 ? (
                  <button
                    type="button"
                    className="staff-bell-clear"
                    aria-label="Limpar notificações"
                    title="Limpar notificações"
                    disabled={clearAll.isPending}
                    onClick={() => {
                      if (window.confirm('Limpar todas as notificações desta lista?')) {
                        clearAll.mutate(undefined, {
                          onSuccess: () => {
                            previousUnread.current = 0;
                            window.dispatchEvent(
                              new CustomEvent('app:toast', {
                                detail: { message: 'Notificações limpas.' },
                              }),
                            );
                          },
                        });
                      }
                    }}
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                ) : null}
              </div>
            </header>

            {notifications.isLoading ? (
              <p className="staff-bell-empty">Carregando...</p>
            ) : items.length === 0 ? (
              <p className="staff-bell-empty">Nenhuma notificação por enquanto.</p>
            ) : (
              <ul className="staff-bell-list">
                {items.map((item) => (
                  <li key={item.id} className={item.readAt ? undefined : 'is-unread'}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.readAt) markRead.mutate(item.id);
                        setOpen(false);
                        if (item.appointmentId) {
                          const params = new URLSearchParams({ appointmentId: item.appointmentId });
                          if (item.appointmentStartsAt) {
                            params.set('date', clinicDateKey(item.appointmentStartsAt));
                          }
                          navigate(`/agenda?${params.toString()}`);
                        } else {
                          navigate('/agenda');
                        }
                      }}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small>{formatWhen(item.createdAt)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="staff-bell" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="staff-bell-trigger"
        aria-label="Notificações de agendamento"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 ? <span className="staff-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>
      {panel}
    </div>
  );
}
