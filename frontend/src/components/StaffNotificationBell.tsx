import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CalendarDays, CheckCheck, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { notifySuccess } from '../lib/notify';
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
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [panelCoords, setPanelCoords] = useState<PanelCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const previousUnread = useRef<number | null>(null);
  const notifications = useStaffNotifications(enabled);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearStaffNotifications();
  const isDentist = role === 'DENTIST';

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
          detail: {
            message: isDentist
              ? 'Nova consulta marcada na sua agenda.'
              : 'Nova solicitação de agendamento recebida.',
          },
        }),
      );
    }
    previousUnread.current = unreadCount;
  }, [enabled, unreadCount, isDentist]);

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
      const preferredWidth = Math.min(380, window.innerWidth - gutter * 2);
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
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    const focusFrame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus();
    });
    return () => {
      cancelAnimationFrame(focusFrame);
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
            id={panelId}
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
              <div className="staff-bell-panel-heading">
                <strong>{isDentist ? 'Notificações' : 'Solicitações online'}</strong>
                <small>{notifications.isError ? 'Atualização indisponível' : notifications.isLoading ? 'Carregando…' : unreadCount > 0 ? `${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}` : 'Você está em dia'}</small>
              </div>
              <div className="staff-bell-panel-actions">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    className="staff-bell-mark-all"
                    aria-label="Marcar todas as notificações como lidas"
                    title="Marcar todas como lidas"
                    disabled={markAllRead.isPending || clearAll.isPending}
                    onClick={() =>
                      markAllRead.mutate(undefined, {
                        onSuccess: () => notifySuccess('Notificações marcadas como lidas.'),
                      })
                    }
                  >
                    <CheckCheck size={15} aria-hidden="true" />
                    Marcar lidas
                  </button>
                ) : null}
                {items.length > 0 ? (
                  <button
                    type="button"
                    className="staff-bell-clear"
                    aria-label="Limpar notificações"
                    title="Limpar notificações"
                    disabled={clearAll.isPending}
                    onClick={() => setClearConfirm(true)}
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                ) : null}
              </div>
            </header>

            {notifications.isError && <div className="staff-bell-empty" role="alert"><p>{items.length ? 'Não foi possível atualizar. A lista abaixo pode estar desatualizada.' : 'Não foi possível carregar as notificações.'}</p><button type="button" className="btn btn-secondary" disabled={notifications.isFetching} onClick={() => notifications.refetch()}>{notifications.isFetching ? 'Tentando…' : 'Tentar novamente'}</button></div>}
            {notifications.isLoading ? (
              <p className="staff-bell-empty">Carregando...</p>
            ) : items.length === 0 ? (
              !notifications.isError && <p className="staff-bell-empty">Nenhuma notificação por enquanto.</p>
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
                      <span className="staff-bell-item-icon" aria-hidden="true"><CalendarDays size={18} strokeWidth={1.6} /></span>
                      <span className="staff-bell-item-content">
                        <strong>{item.title}</strong>
                        <span className="staff-bell-message">{item.message}</span>
                        <span className="staff-bell-item-meta">
                          <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
                          {!item.readAt && <span className="staff-bell-unread-label"><i aria-hidden="true" />Não lida</span>}
                        </span>
                      </span>
                      <ChevronRight className="staff-bell-item-arrow" size={15} aria-hidden="true" />
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
        className={`staff-bell-trigger${unreadCount > 0 ? ' has-unread' : ''}`}
        aria-label={`Notificações de agendamento${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 ? <span className="staff-bell-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>
      {panel}
      {clearConfirm ? (
        <ConfirmDialog
          title="Limpar notificações"
          danger
          confirmLabel="Limpar"
          busy={clearAll.isPending}
          message={<p>Limpar todas as notificações desta lista?</p>}
          onCancel={() => setClearConfirm(false)}
          onConfirm={() =>
            clearAll.mutate(undefined, {
              onSuccess: () => {
                previousUnread.current = 0;
                setClearConfirm(false);
                notifySuccess('Notificações limpas.');
              },
            })
          }
        />
      ) : null}
    </div>
  );
}
