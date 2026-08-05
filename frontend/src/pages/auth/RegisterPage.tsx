import { Building2, CheckCircle2, LockKeyhole, Mail, Phone, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './Login.css';

const LOGO = '/brand/maria-alice-logo.png';

const phoneSchema = z
  .string()
  .refine(
    (value) => value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13,
    'Informe um telefone válido.',
  );

const schema = z.object({
  clinicName: z.string().min(2, 'Informe o nome da clínica.'),
  phone: phoneSchema,
  email: z.string().email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(12, 'Use ao menos 12 caracteres.')
    .regex(/[A-Z]/, 'Inclua uma maiúscula.')
    .regex(/[0-9]/, 'Inclua um número.'),
});

type RegisterData = z.infer<typeof schema>;

const fields: [keyof RegisterData, string, LucideIcon, string][] = [
  ['clinicName', 'Clínica', Building2, 'Maria Alice Odontologia Especializada'],
  ['phone', 'Telefone', Phone, 'Ex.: (11) 99999-9999'],
  ['email', 'E-mail', Mail, 'contato@clinica.com.br'],
  ['password', 'Senha', LockKeyhole, 'Crie uma senha segura'],
];

export default function RegisterPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const form = useForm<RegisterData>({
    resolver: zodResolver(schema),
    defaultValues: { clinicName: 'Maria Alice Odontologia Especializada' },
  });

  const submit = form.handleSubmit(async (data) => {
    setError('');
    try {
      await api.post('/auth/register', data);
      setSent(true);
    } catch {
      setError('Não foi possível criar a conta. Tente outro e-mail.');
    }
  });

  if (sent) {
    return (
      <main className="auth-success">
        <section>
          <span className="success-icon">
            <CheckCircle2 size={35} />
          </span>
          <h1>Conta criada com sucesso</h1>
          <p>
            Seu acesso já está pronto. Faça login para organizar a agenda e a equipe da clínica.
          </p>
          <Link className="btn btn-primary" to="/login">
            Ir para o login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand" aria-label="Ir para a página inicial">
          <img src={LOGO} alt="Maria Alice Odontologia Especializada" className="auth-logo" />
        </Link>

        <div className="auth-copy">
          <span className="auth-kicker">PORTAL MARIA ALICE</span>
          <h1>
            Gestão dedicada para a nossa <em>clínica</em>.
          </h1>
          <p>Organize pacientes, dentistas, consultas e financeiro com praticidade no dia a dia.</p>
        </div>

        <div className="auth-points">
          <span>
            <CheckCircle2 size={18} />
            Acesso exclusivo da equipe
          </span>
          <span>
            <CheckCircle2 size={18} />
            Tudo em um só lugar
          </span>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card auth-card-register">
          <span className="auth-eyebrow">PRIMEIRO ACESSO</span>
          <h2>Vamos começar</h2>
          <p className="auth-lead">Preencha os dados abaixo para criar seu acesso à plataforma.</p>

          <form className="auth-form" onSubmit={submit}>
            {fields.map(([field, label, Icon, placeholder]) => (
              <label key={field}>
                {label}
                <span className="auth-input">
                  <Icon size={18} />
                  <input
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                    placeholder={placeholder}
                    {...form.register(field)}
                  />
                </span>
                <small>{form.formState.errors[field]?.message}</small>
              </label>
            ))}

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn-primary auth-submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Criando acesso...' : 'Criar acesso'}
            </button>
          </form>

          <p className="auth-switch">
            Já possui uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
