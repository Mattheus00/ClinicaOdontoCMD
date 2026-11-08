import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Plus,
  Smile,
  UsersRound,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLandingScrollMotion } from "../../lib/useLandingScrollMotion";
import mountMoment from "./taste/word-highlight/moment.js";
import * as momentLibrary from "./taste/lib.js";
import { ProductMock } from "./ProductMock";
import "./LandingPage.css";

const demoPath = "/cadastro";
const loginPath = "/login";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    text: "Organize consultas, visualize horários e acompanhe os compromissos da equipe com praticidade.",
  },
  {
    icon: UsersRound,
    title: "Gestão de pacientes",
    text: "Centralize cadastros, históricos e informações essenciais para um atendimento mais organizado.",
  },
  {
    icon: CircleDollarSign,
    title: "Controle financeiro",
    text: "Acompanhe receitas, despesas e movimentações financeiras com maior clareza.",
  },
  {
    icon: FileText,
    title: "Prontuário odontológico",
    text: "Registre informações clínicas e acompanhe o histórico dos atendimentos em um ambiente organizado.",
  },
  {
    icon: Smile,
    title: "Odontograma interativo",
    text: "Visualize e registre procedimentos por elemento dentário, facilitando o acompanhamento clínico.",
  },
  {
    icon: LayoutDashboard,
    title: "Relatórios e indicadores",
    text: "Tenha uma visão clara do desempenho da clínica e acompanhe informações relevantes para a gestão.",
  },
  {
    icon: ClipboardList,
    title: "Gestão de equipe",
    text: "Organize acessos e responsabilidades conforme os perfis disponíveis na plataforma.",
  },
  {
    icon: Bell,
    title: "Notificações e lembretes",
    text: "Acompanhe solicitações de agendamento e mantenha a equipe alinhada no dia a dia.",
  },
] as const;

const questions: [string, string][] = [
  [
    "O que é o Velora?",
    "O Velora é uma plataforma de gestão para clínicas odontológicas. Ela reúne agenda, pacientes, financeiro, prontuário e odontograma em um só ambiente.",
  ],
  [
    "Para quais clínicas o Velora foi desenvolvido?",
    "Para clínicas e consultórios odontológicos que precisam organizar a rotina administrativa e clínica — do proprietário à recepção e aos dentistas.",
  ],
  [
    "Posso gerenciar pacientes e agendamentos?",
    "Sim. Você cadastra pacientes, organiza a agenda da equipe e acompanha o status dos compromissos na própria plataforma.",
  ],
  [
    "O Velora possui controle financeiro?",
    "Sim. Há um painel financeiro para acompanhar receitas, movimentações e indicadores relacionados à operação da clínica.",
  ],
  [
    "Posso utilizar o sistema em diferentes dispositivos?",
    "Sim. A interface é responsiva e funciona no computador e em dispositivos móveis pelo navegador.",
  ],
  [
    "Como funciona a contratação?",
    "Você solicita uma demonstração ou cria sua conta pelo site. A equipe orienta os próximos passos conforme o perfil da clínica.",
  ],
  [
    "Como posso solicitar uma demonstração?",
    "Use o botão Solicitar demonstração nesta página. Você será direcionado ao cadastro para iniciar o contato com a equipe Velora.",
  ],
];

const CTA_MOTION_MS = 620;

function LandingCta({
  to,
  variant = "light",
  children,
  onBeforeNavigate,
}: {
  to: string;
  variant?: "light" | "dark";
  children: string;
  onBeforeNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const [firing, setFiring] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (firing) {
      event.preventDefault();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onBeforeNavigate?.();
      return;
    }
    event.preventDefault();
    setFiring(true);
    onBeforeNavigate?.();
    timer.current = window.setTimeout(() => {
      navigate(to);
    }, CTA_MOTION_MS);
  };

  return (
    <Link
      className={`landing-button landing-button-${variant}${firing ? " is-firing" : ""}`}
      to={to}
      onClick={handleClick}
    >
      <span className="landing-button-trail" aria-hidden="true" />
      <span className="landing-button-arrow" aria-hidden="true">
        <ArrowUpRight size={21} strokeWidth={1.7} />
      </span>
      <span className="landing-button-label">{children}</span>
    </Link>
  );
}

function Brand({ variant = "light" }: { variant?: "light" | "dark" }) {
  const src = variant === "dark" ? "/brand/velora-logo-white.webp" : "/brand/velora-logo.webp";
  return (
    <>
      <img src={src} alt="" width="46" height="46" />
      <span>Velora</span>
    </>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const statementRef = useRef<HTMLElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);
  useLandingScrollMotion({ rootRef: landingRef });

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = "Velora | Gestão inteligente para clínicas odontológicas";
    if (description) {
      description.content =
        "Velora — plataforma de gestão para clínicas odontológicas. Agenda, pacientes, financeiro e operação em um só lugar.";
    }
    const root = document.documentElement;
    root.classList.add("landing-active");
    const lockHorizontalScroll = () => {
      if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
    };
    window.addEventListener("scroll", lockHorizontalScroll, { passive: true });
    window.addEventListener("resize", lockHorizontalScroll);
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
      root.classList.remove("landing-active");
      window.removeEventListener("scroll", lockHorizontalScroll);
      window.removeEventListener("resize", lockHorizontalScroll);
    };
  }, []);

  useEffect(() => {
    const root = statementRef.current;
    if (!root) return;
    const heading = root.querySelector("h2");
    const original = heading?.innerHTML;
    const moment = mountMoment(root, {}, momentLibrary);
    return () => {
      moment.destroy?.();
      if (heading && original !== undefined) heading.innerHTML = original;
      root.classList.remove("mo-wh", "is-done");
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) setMenuOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, [menuOpen]);

  return (
    <div
      ref={landingRef}
      className="landing landing-saas"
      id="inicio"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <meta name="page-type" content="software" />
      <meta name="site-kind" content="software" />
      <meta property="og:title" content="Velora | Gestão inteligente para clínicas" />
      <meta
        property="og:description"
        content="Agenda, pacientes, financeiro e a operação da sua clínica odontológica em um só lugar."
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/brand/velora-icon.png" />
      <meta name="twitter:card" content="summary_large_image" />

      <a className="landing-skip" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className={`landing-header${menuOpen ? " is-open" : ""}`}>
        <div className="landing-shell landing-header-inner">
          <a
            className="landing-brand"
            href="#inicio"
            aria-label="Velora, início"
            onClick={() => setMenuOpen(false)}
          >
            <Brand variant={menuOpen ? "light" : "dark"} />
          </a>
          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#plataforma">Plataforma</a>
            <span aria-hidden="true">·</span>
            <a href="#funcionalidades">Funcionalidades</a>
            <span aria-hidden="true">·</span>
            <a href="#beneficios">Benefícios</a>
            <span aria-hidden="true">·</span>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-header-actions">
            <LandingCta to={demoPath} variant="dark">
              Solicitar demonstração
            </LandingCta>
            <button
              ref={menuButton}
              className="landing-menu-toggle"
              type="button"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
        <nav id={menuId} hidden={!menuOpen} className="landing-mobile-menu" aria-label="Menu móvel">
          <a href="#plataforma" onClick={() => setMenuOpen(false)}>
            Plataforma
            <ArrowUpRight />
          </a>
          <a href="#funcionalidades" onClick={() => setMenuOpen(false)}>
            Funcionalidades
            <ArrowUpRight />
          </a>
          <a href="#beneficios" onClick={() => setMenuOpen(false)}>
            Benefícios
            <ArrowUpRight />
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
            <ArrowUpRight />
          </a>
          <Link to={loginPath} onClick={() => setMenuOpen(false)}>
            Entrar
            <ArrowUpRight />
          </Link>
          <LandingCta to={demoPath} variant="dark" onBeforeNavigate={() => setMenuOpen(false)}>
            Solicitar demonstração
          </LandingCta>
        </nav>
      </header>

      <main id="conteudo" tabIndex={-1}>
        <section className="landing-hero landing-hero-saas" aria-labelledby="landing-title">
          <div className="landing-hero-media">
            <img
              src="/landing/smile.webp"
              alt="Mulher sorrindo à luz do sol, fotografia ilustrativa"
              width="1800"
              height="2395"
              fetchPriority="high"
              data-source="stand-in"
              data-subject="sorriso"
            />
          </div>
          <div className="landing-shell landing-hero-saas-inner">
            <div className="landing-hero-copy" data-enter="true">
              <p className="landing-eyebrow">
                <span /> Software de gestão para clínicas
              </p>
              <h1 id="landing-title">
                <span>Gestão elegante para clínicas</span>
                <span>que querem mais controle.</span>
              </h1>
              <p className="landing-hero-lead">
                Centralize agenda, pacientes, financeiro e operação em uma plataforma feita para
                simplificar a rotina da sua equipe e profissionalizar a gestão.
              </p>
              <div className="landing-hero-actions">
                <LandingCta to={demoPath} variant="light">
                  Solicitar demonstração
                </LandingCta>
                <a className="landing-text-link landing-hero-secondary" href="#plataforma">
                  Ver a plataforma
                  <ArrowRight size={18} />
                </a>
              </div>
              <ul className="landing-hero-facts">
                <li>
                  <CalendarDays aria-hidden="true" />
                  <strong>Agenda centralizada</strong>
                </li>
                <li>
                  <UsersRound aria-hidden="true" />
                  <strong>Pacientes organizados</strong>
                </li>
                <li>
                  <CircleDollarSign aria-hidden="true" />
                  <strong>Financeiro mais claro</strong>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          ref={statementRef}
          className="landing-care"
          id="problema"
          data-moment="word-highlight"
          aria-labelledby="problem-title"
        >
          <div className="landing-shell">
            <div className="landing-section-label" data-enter="true">
              <span>01 / O problema</span>
              <span>MENOS COMPLEXIDADE. MAIS CLAREZA.</span>
            </div>
            <h2 className="mo-wh__text" id="problem-title" data-enter="true">
              Sua clínica não precisa ser complicada para funcionar bem. Agendamentos espalhados,
              informações difíceis de encontrar e tarefas que consomem mais tempo do que deveriam.
            </h2>
            <div className="landing-care-bottom" data-enter="true">
              <span className="landing-care-signature">
                O Velora reúne
                <br />o essencial.
              </span>
              <div>
                <p>
                  Em uma experiência simples, organizada e intuitiva — para a equipe trabalhar com
                  mais clareza no dia a dia.
                </p>
                <a className="landing-text-link" href="#plataforma">
                  Ver a plataforma
                  <ArrowUpRight size={20} />
                </a>
              </div>
            </div>
            <ul className="landing-problem-points">
              <li data-enter="true">
                <strong>Menos trabalho manual</strong>
                <p>Organize processos e reduza tarefas repetitivas no dia a dia.</p>
              </li>
              <li data-enter="true">
                <strong>Informações sempre à mão</strong>
                <p>Consulte pacientes, compromissos e dados importantes em um único ambiente.</p>
              </li>
              <li data-enter="true">
                <strong>Mais clareza nas decisões</strong>
                <p>Acompanhe sua operação com informações organizadas e uma visão completa da clínica.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-product" id="plataforma" aria-labelledby="product-title">
          <div className="landing-shell">
            <div className="landing-section-label" data-enter="true">
              <span>02 / Plataforma</span>
              <span>CONHEÇA O VELORA</span>
            </div>
            <div className="landing-product-heading" data-enter="true">
              <h2 id="product-title">
                Tudo o que sua clínica precisa.
                <br />
                Em perfeita sintonia.
              </h2>
              <p>
                Uma plataforma que conecta as diferentes áreas da sua clínica e transforma a gestão
                em uma experiência mais simples.
              </p>
            </div>
            <div className="landing-product-frame" data-enter="true">
              <ProductMock variant="product" />
            </div>
          </div>
        </section>

        <section className="landing-features" id="funcionalidades" aria-labelledby="features-title">
          <div className="landing-shell">
            <div className="landing-section-label" data-enter="true">
              <span>03 / Funcionalidades</span>
              <span>UMA PLATAFORMA. TODA A SUA OPERAÇÃO.</span>
            </div>
            <h2 id="features-title" data-enter="true">
              Cada detalhe da sua clínica,
              <br />
              sob controle.
            </h2>
            <ul className="landing-feature-grid">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} data-enter="true">
                  <Icon size={28} strokeWidth={1.25} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-experience" id="experiencia" aria-labelledby="experience-title">
          <div className="landing-shell landing-experience-grid">
            <div className="landing-experience-copy" data-enter="true">
              <span className="landing-section-number">04 / Experiência</span>
              <p className="landing-kicker">PENSADO PARA QUEM FAZ ACONTECER</p>
              <h2 id="experience-title">
                Tecnologia que simplifica.
                <br />
                Não que complica.
              </h2>
              <p>
                O Velora foi pensado para acompanhar a rotina de clínicas que precisam de eficiência
                sem abrir mão de uma experiência intuitiva. Da recepção à administração, cada
                interação deve facilitar o trabalho da equipe.
              </p>
              <ul>
                <li>Navegação simples e intuitiva.</li>
                <li>Informações organizadas com clareza.</li>
                <li>Interface moderna e responsiva.</li>
                <li>Fluxos pensados para a rotina clínica.</li>
              </ul>
            </div>
            <div className="landing-experience-visual" data-enter="true">
              <ProductMock variant="detail" />
            </div>
          </div>
        </section>

        <section className="landing-benefits" id="beneficios" aria-labelledby="benefits-title">
          <div className="landing-shell">
            <div className="landing-section-label" data-enter="true">
              <span>05 / Benefícios</span>
              <span>MAIS TEMPO PARA O QUE IMPORTA</span>
            </div>
            <div className="landing-benefits-heading" data-enter="true">
              <h2 id="benefits-title">
                Você cuida dos pacientes.
                <br />
                O Velora ajuda a organizar o resto.
              </h2>
              <p>
                Uma boa gestão não precisa ocupar todo o seu dia. Com informações centralizadas e
                processos mais claros, sua equipe trabalha de forma coordenada e você acompanha sua
                clínica com mais tranquilidade.
              </p>
            </div>
            <ul className="landing-benefit-row">
              <li data-enter="true">
                <span>01</span>
                <h3>Organização</h3>
                <p>Uma visão integrada da rotina administrativa e clínica.</p>
              </li>
              <li data-enter="true">
                <span>02</span>
                <h3>Produtividade</h3>
                <p>Menos tarefas dispersas e mais fluidez no trabalho da equipe.</p>
              </li>
              <li data-enter="true">
                <span>03</span>
                <h3>Controle</h3>
                <p>Informações acessíveis para acompanhar a operação e apoiar decisões.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-demo" id="demonstracao" aria-labelledby="demo-title">
          <div className="landing-shell landing-demo-inner" data-enter="true">
            <span className="landing-section-number">06 / Comece</span>
            <p className="landing-kicker">COMECE COM O VELORA</p>
            <h2 id="demo-title">
              O próximo passo da sua clínica
              <br />
              começa aqui.
            </h2>
            <p>
              Conheça uma maneira mais simples de gerenciar sua clínica. Descubra como o Velora pode
              fazer parte da sua rotina.
            </p>
            <div className="landing-demo-actions">
              <LandingCta to={demoPath} variant="dark">
                Solicitar demonstração
              </LandingCta>
              <Link className="landing-text-link" to={demoPath}>
                Falar com a equipe
                <ArrowUpRight size={20} />
              </Link>
            </div>
            <div className="landing-plans-slot" aria-hidden="true">
              <div />
              <div />
              <div />
            </div>
          </div>
        </section>

        <section className="landing-faq" id="faq" aria-labelledby="faq-title">
          <div className="landing-shell landing-faq-grid">
            <div className="landing-faq-heading" data-enter="true">
              <span className="landing-section-number">07 / FAQ</span>
              <h2 id="faq-title">
                Tudo o que você
                <br />
                precisa saber.
              </h2>
              <p>Respostas objetivas sobre a plataforma e como começar.</p>
            </div>
            <div className="landing-faq-list" data-enter="true">
              {questions.map(([question, answer], index) => (
                <details key={question} name="landing-faq" open={index === 0 ? true : undefined}>
                  <summary>
                    <span>{question}</span>
                    <Plus size={20} aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-close landing-close-saas" aria-labelledby="close-title">
          <div className="landing-close-mark" aria-hidden="true">
            <img src="/brand/velora-logo-white.webp" alt="" width="120" height="120" />
          </div>
          <div className="landing-shell landing-close-inner" data-enter="true">
            <h2 id="close-title">
              Uma nova forma
              <br />
              de cuidar da gestão.
            </h2>
            <p>
              Sua clínica evolui todos os dias.
              <br />
              Sua gestão também pode.
            </p>
            <LandingCta to={demoPath} variant="light">
              Conhecer o Velora
            </LandingCta>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer-top">
            <a className="landing-brand" href="#inicio" aria-label="Velora, início">
              <Brand />
            </a>
            <p>
              Gestão inteligente
              <br />
              para clínicas.
            </p>
            <nav aria-label="Navegação do rodapé">
              <a href="#plataforma">Plataforma</a>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#demonstracao">Demonstração</a>
              <a href="#faq">Perguntas frequentes</a>
              <Link to={demoPath}>
                Contato
                <ArrowUpRight size={16} />
              </Link>
              <Link to={loginPath}>
                Entrar
                <ArrowUpRight size={16} />
              </Link>
            </nav>
          </div>
          <div className="landing-footer-wordmark" aria-hidden="true">
            Velora
          </div>
          <div className="landing-footer-meta">
            <span>© {new Date().getFullYear()} Velora</span>
            <a href="#inicio">
              Voltar ao início
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
