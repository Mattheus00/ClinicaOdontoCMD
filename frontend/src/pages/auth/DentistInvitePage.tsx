import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, LoadingState } from '../../components/AsyncState';
import { useAcceptInvite, useInvitePreview } from '../../features/auth/invite';
import { useAuth } from '../../contexts/AuthContext';
import { readApiError } from '../../lib/api-error';
import './Login.css';

const LOGO = '/brand/maria-alice-logo.png';

export default function DentistInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const preview = useInvitePreview(token);
  const accept = useAcceptInvite();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) return;
    if (password.length < 12) {
      setError('Use uma senha com ao menos 12 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    try {
      const response = await accept.mutateAsync({ token, password });
      if (!response.accessToken) throw new Error();
      login(response.accessToken);
      navigate('/agenda', { replace: true });
    } catch (error: unknown) {
      setError(readApiError(error, 'Não foi possível concluir o cadastro. Verifique se o convite ainda é válido.'));
    }
  };

  if (!token) {
    return <EmptyState title="Convite inválido" description="O link de acesso não foi encontrado." />;
  }

  if (preview.isLoading) return <LoadingState label="Validando convite..." />;

  if (preview.isError || !preview.data) {
    return (
      <main className="auth-success">
        <section>
          <h1>Convite inválido ou expirado</h1>
          <p>Solicite um novo link de acesso ao administrador da clínica.</p>
          <Link className="btn btn-primary" to="/login">
            Ir para o login
          </Link>
        </section>
      </main>
    );
  }

  const data = preview.data;

  return (
    <main className="auth-layout">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand" aria-label="Ir para a página inicial">
          <img src={LOGO} alt="Maria Alice Odontologia Especializada" className="auth-logo" />
        </Link>

        <div className="auth-copy">
          <span className="auth-kicker">PRIMEIRO ACESSO</span>
          <h1>
            Bem-vindo(a), <em>{data.professionalName}</em>.
          </h1>
          <p>
            Você foi convidado(a) para acessar o portal da {data.clinicName}. Defina sua senha para começar.
          </p>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-eyebrow">CRIAR SENHA</span>
          <h2>Defina seu acesso</h2>
          <p className="auth-lead">E-mail: {data.email}</p>

          <form onSubmit={submit} className="auth-form">
            <label>
              Senha
              <span className="auth-input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  placeholder="Mínimo de 12 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                />
              </span>
            </label>

            <label>
              Confirmar senha
              <span className="auth-input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={12}
                />
              </span>
            </label>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={accept.isPending}>
              {accept.isPending ? (
                'Criando acesso...'
              ) : (
                <>
                  Entrar no portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Já possui acesso? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
