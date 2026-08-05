import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { readApiError } from '../../lib/api-error';
import './Login.css';

const LOGO = '/brand/maria-alice-logo.png';
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
    <main className="auth-layout">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand" aria-label="Ir para a página inicial">
          <img src={LOGO} alt="Maria Alice Odontologia Especializada" className="auth-logo" />
        </Link>

        <div className="auth-copy">
          <span className="auth-kicker">GESTÃO ODONTOLÓGICA</span>
          <h1>
            Uma clínica organizada começa com uma <em>rotina simples</em>.
          </h1>
          <p>Agenda, pacientes e equipe reunidos em um só lugar — com a elegância que sua clínica merece.</p>
        </div>

        <div className="auth-points">
          <span>
            <CalendarDays size={18} />
            Agenda centralizada
          </span>
          <span>
            <LockKeyhole size={18} />
            Dados protegidos
          </span>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-eyebrow">ACESSO À PLATAFORMA</span>
          <h2>Boas-vindas de volta</h2>
          <p className="auth-lead">Entre para acessar a gestão da sua clínica.</p>
          <p className="auth-hint">
            Dentistas devem usar o <strong>link de convite</strong> enviado pelo administrador para criar a senha no primeiro acesso.
          </p>

          <form onSubmit={submit} className="auth-form">
            <label>
              E-mail
              <span className="auth-input">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="voce@clinica.com.br"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </span>
            </label>

            <label>
              Senha
              <span className="auth-input">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Manter conectado
            </label>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  Entrar <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Ainda não usa a Maria Alice? <Link to="/cadastro">Cadastre sua clínica</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
