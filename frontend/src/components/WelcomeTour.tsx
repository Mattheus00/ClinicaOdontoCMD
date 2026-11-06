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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OPEN_TOUR_EVENT, tourStorageKey } from '../lib/welcomeTour';
import { api } from '../services/api';
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
      'Ao concluir o atendimento, preencha o relatório e conclua a consulta do que foi feito.',
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

const TUTORIAL_VERSION = 1;

export default function WelcomeTour() {
  const { role, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 80 });
  const [anchor, setAnchor] = useState<{left: number; top: number; width: number; height: number} | null>(null);
  const panel = useRef<HTMLElement>(null);
  const steps = role ? STEPS.filter(step => step.roles.includes(role)) : [];
  const step = steps[Math.min(index, Math.max(0, steps.length - 1))];
  const preferences = useQuery({ queryKey: ['user-preferences', userId], enabled: !!userId,
    queryFn: async ({ signal }) => (await api.get<{ tutorialVersion: number }>('/user-preferences', { signal })).data });
  const { mutate: persist } = useMutation({
    mutationFn: async () => (await api.put('/user-preferences', { tutorialVersion: TUTORIAL_VERSION })).data,
    onSuccess: data => client.setQueryData(['user-preferences', userId], data),
    onError: () => window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Tutorial dispensado neste navegador. A sincronização será tentada no próximo acesso.' } })),
  });
  useEffect(() => {
    if (!userId || !role || !preferences.isSuccess) return;
    let localDone = false;
    try { localDone = !!localStorage.getItem(tourStorageKey(userId)); } catch { /* Storage may be disabled. */ }
    if ((preferences.data.tutorialVersion ?? 0) >= TUTORIAL_VERSION) {
      try { localStorage.setItem(tourStorageKey(userId), new Date().toISOString()); } catch { /* Server remains authoritative. */ }
    } else if (localDone) persist();
    else { setIndex(0); setOpen(true); }
  }, [userId, role, preferences.isSuccess, preferences.data?.tutorialVersion, persist]);

  const finish = useCallback(() => {
    if (userId) {
      try { localStorage.setItem(tourStorageKey(userId), new Date().toISOString()); } catch { /* Server stores the preference. */ }
      persist();
    }
    setOpen(false);
  }, [userId, persist]);
  useEffect(() => {
    const reopen = () => { setIndex(0); setOpen(true); };
    window.addEventListener(OPEN_TOUR_EVENT, reopen);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open || !step) return;
    const positionPanel = () => {
      const blocked = !!document.querySelector('[data-app-modal]');
      setPaused(blocked);
      if (blocked) return;
      const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${step.to?.slice(1) ?? 'agenda'}"], main h1`);
      const target = [...candidates].find(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= innerHeight;
      });
      const rect = target?.getBoundingClientRect();
      const width = Math.min(360, innerWidth - 24);
      const height = panel.current?.getBoundingClientRect().height ?? 340;
      const left = rect && rect.right + width + 24 < innerWidth ? rect.right + 12 : Math.max(12, innerWidth - width - 12);
      const top = rect ? Math.max(12, Math.min(rect.top - (rect.top > innerHeight / 2 ? height + 12 : 0), innerHeight - height - 12)) : 80;
      setPosition(current => current.left === left && current.top === top ? current : { left, top });
      setAnchor(current => rect ? current && current.top === rect.top && current.left === rect.left && current.width === rect.width && current.height === rect.height ? current : { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null);
    };
    const frame = requestAnimationFrame(positionPanel);
    const observer = new MutationObserver(positionPanel);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', positionPanel); window.addEventListener('scroll', positionPanel, true);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.querySelector('[data-app-modal]')) finish(); };
    window.addEventListener('keydown', escape);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', positionPanel); window.removeEventListener('scroll', positionPanel, true); window.removeEventListener('keydown', escape); };
  }, [open, index, location.pathname, step, finish]);

  if (!open || !step || paused) return null;
  const isLast = index === steps.length - 1;
  const Icon = step.icon;
  return createPortal(<>
    {anchor && <div className="welcome-tour-highlight" aria-hidden="true" style={anchor} />}
    <aside ref={panel} className="welcome-tour-popover" role="dialog" aria-modal="false" aria-labelledby="welcome-tour-title" style={position}>
      <div className="welcome-tour"><div className="welcome-tour-step"><span>Passo {index + 1} de {steps.length}</span><button type="button" className="icon-button" aria-label="Fechar tutorial" onClick={finish}>×</button></div>
        <span className="welcome-tour-icon" aria-hidden="true"><Icon size={24} /></span>
        <h3 id="welcome-tour-title">{step.title}</h3><p>{step.description}</p>
        {step.tips && <ul>{step.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>}
        <div className="welcome-tour-actions"><button type="button" className="btn btn-ghost" onClick={finish}>{isLast ? 'Fechar' : 'Pular'}</button><div>
          {index > 0 && <button type="button" className="btn btn-secondary" onClick={() => { const previous = steps[index - 1]; if (previous.to) navigate(previous.to); setIndex(value => value - 1); }}>Voltar</button>}
          <button type="button" className="btn btn-primary" onClick={() => { if (isLast) { finish(); navigate('/agenda'); } else { const next = steps[index + 1]; if (next.to) navigate(next.to); setIndex(value => value + 1); } }}>{index === 0 ? 'Começar' : isLast ? 'Ir para agenda' : 'Próximo'}</button>
        </div></div>
      </div>
    </aside>
  </>, document.body);
}
