import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { readApiError } from '../../lib/api-error';
import { preloadDestination } from '../../lib/route-preload';
import { AuthBrand, AuthShell } from './AuthShell';

const REMEMBER_ME_KEY = 'dentic.rememberMe';
const REMEMBER_EMAIL_KEY = 'dentic.rememberEmail';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    setRememberMe(savedRemember);
    if (savedRemember) {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    preloadDestination((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/agenda');

    try {
      const response = await api.post<{ accessToken?: string }>('/auth/login', {
        email,
        password,
        rememberMe,
      });
      if (!response.data.accessToken) throw new Error();
      login(response.data.accessToken);

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/agenda';
      navigate(from, { replace: true });
    } catch (error: unknown) {
      setError(readApiError(error, 'E-mail ou senha não conferem. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <aside className="auth-shell-aside">
        <AuthBrand />

        <div className="auth-shell-copy">
          <p className="auth-shell-kicker">GESTÃO ELEGANTE</p>
          <h1>
            Uma clínica organizada começa com uma <em>rotina simples.</em>
          </h1>
          <p className="auth-shell-desc">
            Agenda, pacientes e equipe reunidos em um só lugar — com a elegância que sua clínica
            merece.
          </p>
          <ul className="auth-shell-points">
            <li>
              <CalendarDays size={18} strokeWidth={1.6} aria-hidden="true" />
              Agenda centralizada
            </li>
            <li>
              <LockKeyhole size={18} strokeWidth={1.6} aria-hidden="true" />
              Dados protegidos
            </li>
          </ul>
        </div>
      </aside>

      <section className="auth-shell-panel" aria-labelledby="login-title">
        <div className="auth-shell-card auth-shell-card--login">
          <p className="auth-shell-eyebrow">ACESSO À PLATAFORMA</p>
          <h2 id="login-title">Boas-vindas de volta</h2>
          <p className="auth-shell-lead">Entre para acessar a gestão da sua clínica.</p>

          <p className="auth-shell-hint">
            <Info size={18} strokeWidth={1.6} aria-hidden="true" />
            <span>
              Dentistas devem usar o <strong>link de convite</strong> enviado pelo administrador
              para criar a senha no primeiro acesso.
            </span>
          </p>

          <form onSubmit={submit} className="auth-shell-form">
            <div className="auth-shell-field">
              <label className="auth-shell-label" htmlFor="login-email">
                E-mail
              </label>
              <span className="auth-shell-input">
                <Mail size={18} strokeWidth={1.6} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </span>
            </div>

            <div className="auth-shell-field">
              <label className="auth-shell-label" htmlFor="login-password">
                Senha
              </label>
              <span className="auth-shell-input">
                <LockKeyhole size={18} strokeWidth={1.6} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-shell-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>

            <label className="auth-shell-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Manter conectado
            </label>

            {error ? (
              <div className="auth-shell-error" role="alert">
                {error}
              </div>
            ) : null}

            <button type="submit" className="auth-shell-submit" disabled={loading}>
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-shell-switch">
            Ainda não usa a Velora? <Link to="/cadastro">Cadastre sua clínica</Link>
          </p>
        </div>
      </section>
    </AuthShell>
  );
}
