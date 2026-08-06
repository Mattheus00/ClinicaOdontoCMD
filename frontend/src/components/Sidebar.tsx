import { CalendarDays, CircleDollarSign, ClipboardList, Link2, LogOut, Stethoscope, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../lib/useMediaQuery';
import StaffNotificationBell from './StaffNotificationBell';
import './Sidebar.css';
import './StaffNotificationBell.css';

const LOGO = '/brand/maria-alice-logo.png';

type AppRole = 'ADMIN' | 'SECRETARY' | 'DENTIST';

const allNavItems: Array<{
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof CalendarDays;
  roles: AppRole[];
}> = [
  { to: '/agenda', label: 'Agenda', shortLabel: 'Agenda', icon: CalendarDays, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/patients', label: 'Pacientes', shortLabel: 'Pacientes', icon: UsersRound, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/dentists', label: 'Dentistas', shortLabel: 'Dentistas', icon: Stethoscope, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/financial', label: 'Financeiro', shortLabel: 'Finanças', icon: CircleDollarSign, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/procedures', label: 'Procedimentos', shortLabel: 'Proced.', icon: ClipboardList, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/booking-link', label: 'Link da bio', shortLabel: 'Link bio', icon: Link2, roles: ['ADMIN', 'SECRETARY'] },
];

export default function Sidebar() {
  const { logout, role } = useAuth();
  const isMobile = useMediaQuery('(max-width: 800px)');
  const navItems = allNavItems.filter((item) => (role ? item.roles.includes(role) : true));
  const canManageBookings = role === 'ADMIN' || role === 'SECRETARY';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={LOGO} alt="Maria Alice Odontologia Especializada" />
        <small>{role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão'}</small>
      </div>

      {canManageBookings ? (
        <div className="sidebar-notifications">
          <StaffNotificationBell enabled={!isMobile} />
          <span>Solicitações online</span>
        </div>
      ) : null}

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {navItems.map(({ to, label, shortLabel, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span className="sidebar-link-label-full">{label}</span>
            <span className="sidebar-link-label-short">{shortLabel}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout-btn" onClick={logout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
