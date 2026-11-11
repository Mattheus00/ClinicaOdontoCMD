import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE = 'Velora';

const TITLES: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (p) => p === '/', title: 'Início' },
  { match: (p) => p === '/login', title: 'Entrar' },
  { match: (p) => p === '/cadastro', title: 'Cadastro' },
  { match: (p) => p === '/confirmar-email', title: 'Confirmar e-mail' },
  { match: (p) => p.startsWith('/convite/'), title: 'Convite' },
  { match: (p) => p.startsWith('/agendar'), title: 'Agendar consulta' },
  { match: (p) => p === '/agenda', title: 'Agenda' },
  { match: (p) => p === '/financial', title: 'Financeiro' },
  { match: (p) => p.startsWith('/patients/'), title: 'Paciente' },
  { match: (p) => p === '/patients', title: 'Pacientes' },
  { match: (p) => p.startsWith('/odontograma/'), title: 'Odontograma' },
  { match: (p) => p === '/dentists', title: 'Dentistas' },
  { match: (p) => p === '/procedures', title: 'Procedimentos' },
  { match: (p) => p === '/estoque', title: 'Estoque' },
  { match: (p) => p === '/booking-link', title: 'Link de agendamento' },
  { match: (p) => p === '/billing', title: 'Assinatura' },
  { match: (p) => p === '/onboarding', title: 'Primeiros passos' },
];

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = TITLES.find((row) => row.match(pathname));
    document.title = entry ? `${entry.title} · ${BASE}` : BASE;
  }, [pathname]);

  return null;
}
