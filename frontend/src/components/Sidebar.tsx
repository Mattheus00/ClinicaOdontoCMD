import { CalendarDays, CircleDollarSign, ClipboardList, LogOut, Stethoscope, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const LOGO = '/brand/maria-alice-logo.png';

type AppRole = 'ADMIN' | 'SECRETARY' | 'DENTIST';

const allNavItems: Array<{
  to: string;
  label: string;
  icon: typeof CalendarDays;
  roles: AppRole[];
}> = [
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/patients', label: 'Pacientes', icon: UsersRound, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/dentists', label: 'Dentistas', icon: Stethoscope, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/financial', label: 'Financeiro', icon: CircleDollarSign, roles: ['ADMIN', 'SECRETARY', 'DENTIST'] },
  { to: '/procedures', label: 'Procedimentos', icon: ClipboardList, roles: ['ADMIN', 'SECRETARY'] },
];

export default function Sidebar() {
  const { logout, role } = useAuth();
  const navItems = allNavItems.filter((item) => (role ? item.roles.includes(role) : true));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={LOGO} alt="Maria Alice Odontologia Especializada" />
        <small>{role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão'}</small>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
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
