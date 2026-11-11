export type VeloraPlan = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  listPriceCents: number;
  maxProfessionals: number;
  maxTeamUsers: number;
  features: string[];
  highlighted: boolean;
  checkoutEnabled: boolean;
  comingSoon?: boolean;
};

export const VELORA_PLANS: VeloraPlan[] = [
  {
    slug: 'solo',
    name: 'Solo',
    description: 'Consultórios individuais',
    priceCents: 6900,
    listPriceCents: 8900,
    maxProfessionals: 1,
    maxTeamUsers: 2,
    features: [
      'Agenda de consultas',
      'Agendamento online',
      'Gestão de pacientes',
      'Prontuário odontológico',
      'Odontograma',
      'Cadastro de procedimentos',
      'Controle financeiro básico',
    ],
    highlighted: false,
    checkoutEnabled: true,
  },
  {
    slug: 'clinica',
    name: 'Clínica',
    description: 'Clínicas em crescimento',
    priceCents: 12900,
    listPriceCents: 16900,
    maxProfessionals: 5,
    maxTeamUsers: 10,
    features: [
      'Tudo do Solo',
      'Financeiro por dentista',
      'Gestão de estoque',
      'Relatórios financeiros completos',
      'Gestão de permissões',
      'Até 5 dentistas',
    ],
    highlighted: true,
    checkoutEnabled: true,
  },
  {
    slug: 'performance',
    name: 'Performance',
    description: 'Operações avançadas',
    priceCents: 27900,
    listPriceCents: 27900,
    maxProfessionals: 15,
    maxTeamUsers: 30,
    features: [
      'Tudo do Clínica',
      'Lembretes automáticos',
      'Integração WhatsApp',
      'Múltiplas unidades',
      'Dashboard avançado',
      'Até 15 dentistas',
    ],
    highlighted: false,
    checkoutEnabled: false,
    comingSoon: true,
  },
];

export const moneyFromCents = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
