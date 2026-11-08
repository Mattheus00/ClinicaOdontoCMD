import {
  CalendarDays,
  CircleDollarSign,
  CircleHelp,
  ClipboardList,
  Link2,
  LogOut,
  Package,
  Stethoscope,
  UsersRound,
  MoreHorizontal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../lib/useMediaQuery';
import StaffNotificationBell from './StaffNotificationBell';
import { openWelcomeTour } from '../lib/welcomeTour';
import './Sidebar.css';
import './StaffNotificationBell.css';

const LOGO = '/brand/velora-logo-white.webp';

type AppRole = 'ADMIN' | 'SECRETARY' | 'DENTIST';

const allNavItems: Array<{
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof CalendarDays;
  roles: AppRole[];
}> = [
  { to: '/agenda', label: 'Agenda', shortLabel: 'Agenda', icon: CalendarDays, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/patients', label: 'Pacientes', shortLabel: 'Pacientes', icon: UsersRound, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/dentists', label: 'Dentistas', shortLabel: 'Dentistas', icon: Stethoscope, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/financial', label: 'Financeiro', shortLabel: 'Finanças', icon: CircleDollarSign, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/procedures', label: 'Procedimentos', shortLabel: 'Proced.', icon: ClipboardList, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/estoque', label: 'Estoque', shortLabel: 'Estoque', icon: Package, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/booking-link', label: 'Link da bio', shortLabel: 'Link bio', icon: Link2, roles: ['ADMIN', 'SECRETARY'] },
];

export default function Sidebar() {
  const { logout, role } = useAuth();
  const isMobile = useMediaQuery('(max-width: 800px)');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navItems = allNavItems.filter((item) => (role ? item.roles.includes(role) : true));
  const primaryPaths = ['/agenda', '/patients', '/financial', '/estoque'];
  const visibleItems = isMobile ? navItems.filter(item => primaryPaths.includes(item.to)) : navItems;
  const otherItems = navItems.filter(item => !primaryPaths.includes(item.to));
  useEffect(() => { setMoreOpen(false); }, [location.pathname, isMobile]);
  useEffect(() => {
    if (!moreOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMoreOpen(false); moreButton.current?.focus(); } };
    const outside = (event: MouseEvent) => { if (!moreRef.current?.contains(event.target as Node) && !moreButton.current?.contains(event.target as Node)) setMoreOpen(false); };
    window.addEventListener('keydown', escape); window.addEventListener('mousedown', outside);
    moreRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('mousedown', outside); };
  }, [moreOpen]);
  const showNotifications = role === 'ADMIN' || role === 'SECRETARY' || role === 'DENTIST';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-lockup">
          <img src={LOGO} alt="" />
          <strong>Velora</strong>
        </div>
        <small>{role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão'}</small>
      </div>

      {showNotifications ? (
        <div className="sidebar-notifications">
          <StaffNotificationBell enabled={!isMobile} />
          <span>{role === 'DENTIST' ? 'Suas notificações' : 'Solicitações online'}</span>
        </div>
      ) : null}

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} data-tour={to.slice(1)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
        {isMobile && otherItems.length > 0 && <button type="button" ref={moreButton} className={`sidebar-link${otherItems.some(item => location.pathname.startsWith(item.to)) ? ' active' : ''}`} aria-expanded={moreOpen} aria-controls="mobile-more-navigation" onClick={() => setMoreOpen(value => !value)}><MoreHorizontal size={20} aria-hidden="true" /><span>Mais</span></button>}
      </nav>
      {isMobile && moreOpen && <div ref={moreRef} id="mobile-more-navigation" className="sidebar-more" role="dialog" aria-label="Mais opções de navegação"><strong>Mais opções</strong>{otherItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} data-tour={to.slice(1)}><Icon size={20} aria-hidden="true" />{label}</NavLink>)}<button type="button" className="btn btn-secondary" onClick={() => { setMoreOpen(false); moreButton.current?.focus(); }}>Fechar</button></div>}

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout-btn sidebar-tour-btn" onClick={openWelcomeTour}>
          <CircleHelp size={17} />
          Tutorial
        </button>
        <button type="button" className="sidebar-logout-btn" onClick={logout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
