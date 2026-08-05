import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './MobileTopbar.css';

const LOGO = '/brand/maria-alice-logo.png';

export default function MobileTopbar() {
  const { logout, role } = useAuth();

  return (
    <header className="mobile-topbar">
      <img src={LOGO} alt="Maria Alice Odontologia" className="mobile-topbar-logo" />
      <div className="mobile-topbar-copy">
        <strong>Maria Alice</strong>
        <span>{role === 'DENTIST' ? 'Portal do dentista' : 'Portal de gestão'}</span>
      </div>
      <button type="button" className="mobile-topbar-logout" onClick={logout} aria-label="Sair">
        <LogOut size={18} />
      </button>
    </header>
  );
}
