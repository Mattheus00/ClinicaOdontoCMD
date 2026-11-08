import { CircleHelp, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../lib/useMediaQuery';
import StaffNotificationBell from './StaffNotificationBell';
import { openWelcomeTour } from '../lib/welcomeTour';
import './StaffNotificationBell.css';
import './MobileTopbar.css';

const LOGO = '/brand/velora-logo.png';

export default function MobileTopbar() {
  const { logout, role } = useAuth();
  const isMobile = useMediaQuery('(max-width: 800px)');
  const portalLabel = role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão';
  const showNotifications = role === 'ADMIN' || role === 'SECRETARY' || role === 'DENTIST';

  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar-brand">
        <img src={LOGO} alt="Velora" className="mobile-topbar-logo" />
        <div className="mobile-topbar-copy">
          <strong>Velora</strong>
          <span>{portalLabel}</span>
        </div>
      </div>
      <div className="mobile-topbar-actions">
        {showNotifications ? <StaffNotificationBell enabled={isMobile} /> : null}
        <button type="button" className="mobile-topbar-logout" onClick={openWelcomeTour} aria-label="Tutorial">
          <CircleHelp size={16} strokeWidth={1.8} />
        </button>
        <button type="button" className="mobile-topbar-logout" onClick={logout} aria-label="Sair">
          <LogOut size={16} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
