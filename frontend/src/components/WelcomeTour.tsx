import {
  BellRing,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Link2,
  Package,
  Sparkles,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OPEN_TOUR_EVENT, tourStorageKey } from '../lib/welcomeTour';
import { Modal } from './Modal';
import './WelcomeTour.css';

type Role = 'ADMIN' | 'SECRETARY' | 'DENTIST';

type TourStep = {
  icon: LucideIcon;
  title: string;
  description: string;
  tips?: string[];
  to?: string;
  roles: Role[];
};

const STEPS: TourStep[] = [
  {
    icon: Sparkles,
    title: 'Boas-vindas ao portal Maria Alice',
    description:
      'Em poucos passos você vai conhecer as áreas do sistema. Você pode pular agora e rever este tutorial quando quiser pelo botão "Tutorial" no menu.',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
  {
    icon: CalendarDays,
    title: 'Agenda',
    description: 'É a tela principal: mostra as consultas da semana e de cada dentista.',
    tips: [
      'Clique em "Novo agendamento" para marcar uma consulta.',
      'Clique em uma consulta para confirmar, cancelar ou enviar a confirmação pelo WhatsApp.',
      'Solicitações vindas do link da bio aparecem como "Aguardando aceite".',
    ],
    to: '/agenda',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: CalendarDays,
    title: 'Sua agenda',
    description: 'Aqui ficam as suas consultas da semana.',
    tips: [
      'Clique em uma consulta para ver os dados do paciente.',
      'Ao concluir o atendimento, confirme a consulta e preencha o relatório do que foi feito.',
      'O relatório fica no histórico do paciente para qualquer dentista consultar depois.',
    ],
    to: '/agenda',
    roles: ['DENTIST'],
  },
  {
    icon: UsersRound,
    title: 'Pacientes',
    description: 'Cadastro completo de cada paciente, com prontuário.',
    tips: [
      'Use a busca por nome, telefone ou CPF.',
      'Na ficha ficam cadastro, anamnese, odontograma, histórico de consultas e financeiro.',
      'Quando marcarem uma consulta com você, o sino de notificações avisa na hora.',
    ],
    to: '/patients',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
  {
    icon: Stethoscope,
    title: 'Dentistas',
    description: 'Monte a equipe da clínica.',
    tips: [
      'Cadastre o dentista e envie o link de primeiro acesso para ele criar a senha.',
      'O dentista só aparece no agendamento online depois de concluir esse primeiro acesso.',
    ],
    to: '/dentists',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: ClipboardList,
    title: 'Procedimentos',
    description: 'Lista de tratamentos oferecidos e seus valores.',
    tips: ['Os procedimentos aparecem na hora de agendar e no link da bio.'],
    to: '/procedures',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: Package,
    title: 'Estoque',
    description: 'Controle de materiais odontológicos e dos demais itens da clínica.',
    tips: [
      'Use "Entrada" quando chegar material e "Saída" quando ele for usado.',
      'Itens abaixo do estoque mínimo aparecem com o aviso "Repor".',
    ],
    to: '/estoque',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: Package,
    title: 'Estoque',
    description: 'Registre os materiais que você usar nos atendimentos.',
    tips: ['Clique em "Saída" no material usado e informe a quantidade.'],
    to: '/estoque',
    roles: ['DENTIST'],
  },
  {
    icon: CircleDollarSign,
    title: 'Financeiro',
    description: 'Acompanhe o faturamento e os pagamentos das consultas realizadas.',
    to: '/financial',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
  {
    icon: Link2,
    title: 'Link da bio',
    description: 'Link de agendamento online para colocar no Instagram.',
    tips: [
      'O paciente escolhe dentista, procedimento e horário.',
      'Cada pedido chega no sino de "Solicitações online" para a equipe aceitar ou recusar.',
    ],
    to: '/booking-link',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: BellRing,
    title: 'Tudo pronto!',
    description: 'Comece pela agenda. Se precisar, abra o tutorial de novo pelo botão "Tutorial" no menu.',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
];

export default function WelcomeTour() {
  const { role, userId } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const steps = role ? STEPS.filter((step) => step.roles.includes(role)) : [];

  useEffect(() => {
    if (!userId || !role) return;
    if (!window.localStorage.getItem(tourStorageKey(userId))) {
      setIndex(0);
      setOpen(true);
    }
  }, [userId, role]);

  useEffect(() => {
    const reopen = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_TOUR_EVENT, reopen);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, reopen);
  }, []);

  const finish = useCallback(() => {
    if (userId) window.localStorage.setItem(tourStorageKey(userId), new Date().toISOString());
    setOpen(false);
  }, [userId]);

  if (!open || steps.length === 0) return null;

  const step = steps[Math.min(index, steps.length - 1)];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const Icon = step.icon;

  const goNext = () => {
    if (isLast) {
      finish();
      navigate('/agenda');
      return;
    }
    const next = steps[index + 1];
    if (next.to) navigate(next.to);
    setIndex(index + 1);
  };

  const goBack = () => {
    const previous = steps[index - 1];
    if (previous?.to) navigate(previous.to);
    setIndex(index - 1);
  };

  return (
    <Modal title={`Passo ${index + 1} de ${steps.length}`} onClose={finish}>
      <div className="welcome-tour">
        <span className="welcome-tour-icon" aria-hidden>
          <Icon size={26} strokeWidth={1.8} />
        </span>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        {step.tips?.length ? (
          <ul>
            {step.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        ) : null}

        <div className="welcome-tour-dots" aria-hidden>
          {steps.map((item, position) => (
            <span key={`${item.title}-${position}`} className={position === index ? 'is-active' : undefined} />
          ))}
        </div>

        <div className="welcome-tour-actions">
          <button type="button" className="btn btn-ghost" onClick={finish}>
            {isLast ? 'Fechar' : 'Pular tutorial'}
          </button>
          <div>
            {!isFirst ? (
              <button type="button" className="btn btn-secondary" onClick={goBack}>
                Voltar
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={goNext}>
              {isFirst ? 'Começar' : isLast ? 'Ir para a agenda' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
