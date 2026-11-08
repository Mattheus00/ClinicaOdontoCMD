import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './AuthShell.css';

const LOGO = '/brand/velora-logo-white.webp';
const PHOTO = '/landing/smile.webp';

export function AuthShell({
  children,
  className = '',
  centered = false,
}: {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <main className={`auth-shell${centered ? ' auth-shell--success' : ''}${className ? ` ${className}` : ''}`}>
      <div className="auth-shell-media" aria-hidden="true">
        <img src={PHOTO} alt="" width="1800" height="2395" fetchPriority="high" />
      </div>
      {centered ? children : <div className="auth-shell-grid">{children}</div>}
    </main>
  );
}

export function AuthBrand() {
  return (
    <Link to="/" className="auth-shell-brand" aria-label="Velora, ir para a página inicial">
      <img src={LOGO} alt="" width="46" height="46" />
      <span>Velora</span>
    </Link>
  );
}
