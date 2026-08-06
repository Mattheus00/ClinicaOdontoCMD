import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../lib/useMediaQuery';
import StaffNotificationBell from './StaffNotificationBell';
import './StaffNotificationBell.css';
import './MobileTopbar.css';

const LOGO = '/brand/maria-alice-logo.png';

export default function MobileTopbar() {
  const { logout, role } = useAuth();
  const isMobile = useMediaQuery('(max-width: 800px)');
  const portalLabel = role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão';
  const canManageBookings = role === 'ADMIN' || role === 'SECRETARY';

  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar-brand">
        <img src={LOGO} alt="Maria Alice Odontologia Especializada" className="mobile-topbar-logo" />
        <div className="mobile-topbar-copy">
          <strong>Maria Alice</strong>
          <span>{portalLabel}</span>
        </div>
      </div>
      <div className="mobile-topbar-actions">
        {canManageBookings ? <StaffNotificationBell enabled={isMobile} /> : null}
        <button type="button" className="mobile-topbar-logout" onClick={logout} aria-label="Sair">
          <LogOut size={16} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
