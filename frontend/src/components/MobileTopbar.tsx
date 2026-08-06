import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './MobileTopbar.css';

const LOGO = '/brand/maria-alice-logo.png';

export default function MobileTopbar() {
  const { logout, role } = useAuth();
  const portalLabel = role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão';

  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar-brand">
        <img src={LOGO} alt="" className="mobile-topbar-logo" />
        <div className="mobile-topbar-copy">
          <strong>Maria Alice</strong>
          <span>{portalLabel}</span>
        </div>
      </div>
      <button type="button" className="mobile-topbar-logout" onClick={logout} aria-label="Sair">
        <LogOut size={16} strokeWidth={1.8} />
        <span>Sair</span>
      </button>
    </header>
  );
}
