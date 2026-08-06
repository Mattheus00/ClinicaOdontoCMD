import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
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

export default function StaffNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousUnread = useRef<number | null>(null);
  const notifications = useStaffNotifications(true);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.data?.unreadCount ?? 0;
  const items = notifications.data?.items ?? [];

  useEffect(() => {
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
  }, [unreadCount]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div className="staff-bell" ref={rootRef}>
      <button
        type="button"
        className="staff-bell-trigger"
        aria-label="Notificações de agendamento"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 ? <span className="staff-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="staff-bell-panel" role="dialog" aria-label="Notificações">
          <header className="staff-bell-panel-head">
            <strong>Solicitações</strong>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                Marcar todas
              </button>
            ) : null}
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
                      navigate('/agenda');
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
