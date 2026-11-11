import {
  CalendarDays,
  ClipboardList,
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
    title: 'Primeiros passos',
    description:
      'Este checklist rápido mostra o essencial para colocar a clínica em funcionamento no Velora.',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
  {
    icon: Stethoscope,
    title: 'Cadastre um dentista',
    description: 'Adicione a equipe e envie o link de primeiro acesso para cada profissional.',
    tips: ['O dentista só entra na agenda online depois de criar a senha pelo convite.'],
    to: '/dentists',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: ClipboardList,
    title: 'Defina os procedimentos',
    description: 'Cadastre os tratamentos e valores usados na agenda e no link da bio.',
    to: '/procedures',
    roles: ['ADMIN', 'SECRETARY'],
  },
  {
    icon: UsersRound,
    title: 'Cadastre um paciente',
    description: 'Na ficha ficam cadastro, anamnese, odontograma e financeiro do paciente.',
    to: '/patients',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
  {
    icon: CalendarDays,
    title: 'Primeiro agendamento',
    description: 'Marque a primeira consulta na agenda — é o centro do dia a dia da clínica.',
    tips: ['Use "Novo agendamento" para escolher paciente, dentista, procedimento e horário.'],
    to: '/agenda',
    roles: ['ADMIN', 'SECRETARY', 'DENTIST'],
  },
];

const TUTORIAL_VERSION = 2;

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
