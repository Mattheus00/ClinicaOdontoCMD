import { useEffect, useRef, useState } from 'react';
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

export default function StaffNotificationBell({ enabled = true }: { enabled?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus();
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="staff-bell" ref={rootRef}>
      <button
        type="button"
        className="staff-bell-trigger"
        aria-label="Notificações de agendamento"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 ? <span className="staff-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="staff-bell-panel" role="dialog" aria-label="Notificações" ref={panelRef}>
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
        </div>
      ) : null}
    </div>
  );
}
