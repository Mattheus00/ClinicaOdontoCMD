import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  LockKeyhole,
  Mail,
  Phone,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { maskPhone, withMask } from '../../lib/masks';
import { readApiError } from '../../lib/api-error';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { AuthBrand, AuthShell } from './AuthShell';

const phoneSchema = z
  .string()
  .refine(
    (value) => value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13,
    'Informe um telefone válido.',
  );

const PASSWORD_RULES = [
  { id: 'length', label: 'Ao menos 12 caracteres', test: (value: string) => value.length >= 12 },
  { id: 'upper', label: 'Uma letra maiúscula', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'digit', label: 'Um número', test: (value: string) => /[0-9]/.test(value) },
] as const;

const passwordSchema = z.string().superRefine((value, context) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(value)) {
      context.addIssue({ code: 'custom', message: rule.label });
    }
  }
});

const schema = z.object({
  clinicName: z.string().min(2, 'Informe o nome da clínica.'),
  phone: phoneSchema,
  email: z.string().email('Informe um e-mail válido.'),
  password: passwordSchema,
});

type RegisterData = z.infer<typeof schema>;

const fields: [keyof RegisterData, string, LucideIcon, string][] = [
  ['clinicName', 'Clínica', Building2, 'Ex.: Clínica São Lucas'],
  ['phone', 'Telefone', Phone, 'Ex.: (11) 99999-9999'],
  ['email', 'E-mail', Mail, 'Seu e-mail profissional'],
  ['password', 'Senha', LockKeyhole, 'Crie uma senha segura'],
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sent, setSent] = useState(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterData>({
    resolver: zodResolver(schema),
    defaultValues: { clinicName: '' },
  });
  const passwordValue = form.watch('password') ?? '';

  useEffect(() => {
    const plan = searchParams.get('plan')?.trim().toLowerCase();
    if (plan === 'solo' || plan === 'clinica') {
      sessionStorage.setItem('velora.preferredPlan', plan);
    }
  }, [searchParams]);

  const submit = form.handleSubmit(async (data) => {
    setError('');
    try {
      await api.post('/auth/register', data);
      try {
        const response = await api.post<{ accessToken?: string }>('/auth/login', {
          email: data.email,
          password: data.password,
          rememberMe: true,
        });
        if (response.data.accessToken) {
          login(response.data.accessToken);
          const next = searchParams.get('next');
          const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/billing';
          navigate(safeNext, { replace: true });
          return;
        }
      } catch {
        setAutoLoginFailed(true);
      }
      setSent(true);
    } catch (cause: unknown) {
      setError(readApiError(cause, 'Não foi possível criar a conta. Tente outro e-mail.'));
    }
  });

  if (sent) {
    return (
      <AuthShell centered>
        <section className="auth-shell-card">
          <span className="auth-shell-success-icon" aria-hidden="true">
            <CheckCircle2 size={34} />
          </span>
          <h1>Conta criada com sucesso</h1>
          {autoLoginFailed ? (
            <p>
              Sua clínica já está cadastrada. Entre com o e-mail e a senha que você acabou de definir para começar a
              configurar plano e equipe.
            </p>
          ) : (
            <p>Seu acesso já está pronto. Faça login para organizar a agenda e a equipe da clínica.</p>
          )}
          <Link className="auth-shell-submit" to={`/login?next=${encodeURIComponent('/billing')}`}>
            Ir para o login
            <ArrowRight size={18} strokeWidth={1.8} />
          </Link>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <aside className="auth-shell-aside">
        <AuthBrand />

        <div className="auth-shell-copy">
          <p className="auth-shell-kicker">PORTAL VELORA</p>
          <h1>
            Gestão dedicada para a sua <em>clínica.</em>
          </h1>
          <p className="auth-shell-desc">
            Organize pacientes, dentistas, consultas e financeiro com praticidade no dia a dia.
          </p>
          <ul className="auth-shell-points">
            <li>
              <UsersRound size={18} strokeWidth={1.6} aria-hidden="true" />
              Acesso exclusivo da equipe
            </li>
            <li>
              <Layers size={18} strokeWidth={1.6} aria-hidden="true" />
              Tudo em um só lugar
            </li>
          </ul>
        </div>
      </aside>

      <section className="auth-shell-panel" aria-labelledby="register-title">
        <div className="auth-shell-card">
          <h2 id="register-title">Criar conta</h2>
          <p className="auth-shell-lead">Preencha os dados para começar.</p>

          <form className="auth-shell-form" onSubmit={submit} noValidate>
            {fields.map(([field, label, Icon, placeholder]) => {
              const registration = form.register(field);
              const isPassword = field === 'password';
              const inputId = `register-${field}`;
              return (
                <div key={field} className="auth-shell-field">
                  <label className="auth-shell-label" htmlFor={inputId}>
                    {label}
                  </label>
                  <span className="auth-shell-input">
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                    <input
                      id={inputId}
                      type={
                        isPassword
                          ? showPassword
                            ? 'text'
                            : 'password'
                          : field === 'email'
                            ? 'email'
                            : 'text'
                      }
                      inputMode={field === 'phone' ? 'tel' : undefined}
                      autoComplete={
                        isPassword ? 'new-password' : field === 'email' ? 'email' : 'organization'
                      }
                      placeholder={placeholder}
                      aria-invalid={Boolean(form.formState.errors[field])}
                      aria-describedby={isPassword ? 'register-password-rules' : form.formState.errors[field] ? `${field}-error` : undefined}
                      {...registration}
                      onChange={
                        field === 'phone'
                          ? withMask(maskPhone, registration.onChange)
                          : registration.onChange
                      }
                    />
                    {isPassword ? (
                      <button
                        type="button"
                        className="auth-shell-toggle"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    ) : null}
                  </span>
                  {isPassword ? (
                    <ul
                      id="register-password-rules"
                      className="auth-shell-password-rules"
                      aria-live="polite"
                    >
                      {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(passwordValue);
                        return (
                          <li key={rule.id} className={met ? 'is-met' : undefined}>
                            <Check size={14} aria-hidden="true" />
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <small id={`${field}-error`}>{form.formState.errors[field]?.message}</small>
                  )}
                </div>
              );
            })}

            {error ? (
              <p className="auth-shell-error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className="auth-shell-submit"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                'Criando acesso...'
              ) : (
                <>
                  Criar acesso
                  <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-shell-switch">
            Já possui uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </AuthShell>
  );
}
