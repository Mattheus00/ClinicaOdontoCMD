import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { bookingPath, isUxDemo } from "../../lib/experience";
import "./LandingPage.css";

const LOGO = "/brand/maria-alice-logo.webp";
const NAV = [
  { href: "#avaliacao", label: "A avaliação" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#duvidas", label: "Dúvidas frequentes" },
];
const STEPS = [
  {
    title: "Escolha seu horário",
    text: "Selecione a avaliação, o profissional e um horário disponível.",
  },
  {
    title: "Revise com calma",
    text: "Confira suas escolhas e os dados de contato antes de enviar.",
  },
  {
    title: "Aguarde o aceite",
    text: "A equipe analisa a solicitação. O envio ainda não confirma o atendimento.",
  },
];
const FAQ = [
  {
    question: "Como solicito uma avaliação?",
    answer:
      "Escolha o serviço, o profissional, a data e um dos horários disponíveis. Preencha a identificação, revise suas escolhas e envie a solicitação.",
  },
  {
    question: "O envio já confirma meu horário?",
    answer:
      "Não. O pedido fica aguardando aceite da equipe. Nesta demonstração, ainda não existe uma área do paciente para acompanhar a solicitação e nenhuma mensagem é enviada.",
  },
  {
    question: "Existe pagamento pelo site?",
    answer:
      "Não há cobrança ou pagamento online nesta demonstração. Valores e condições de um atendimento real precisam ser definidos após avaliação.",
  },
  {
    question: "Como cancelar ou remarcar?",
    answer:
      "Nesta versão, essas ações são feitas pela recepção na agenda. O paciente ainda não pode alterar o pedido pelo site. A política de prazos será definida antes de um uso real.",
  },
  {
    question: "Quais dados devo preencher?",
    answer:
      "Para explorar a demonstração, use nome e telefone fictícios. O e-mail é opcional. Não informe dados pessoais reais ou informações de saúde.",
  },
  {
    question: "Esta clínica oferece atendimento real?",
    answer:
      "Não. Maria Alice é uma clínica fictícia neste projeto. As fotos são de banco de imagens e não representam suas instalações ou equipe.",
  },
];

const HERO_SLIDES = [
  { label: "Avaliação", title: "Seu cuidado começa com uma conversa.", copy: "A avaliação é o primeiro passo para entender o que seu sorriso precisa.", image: "/images/clinic-room-800.webp", srcSet: "/images/clinic-room-480.webp 480w, /images/clinic-room-800.webp 800w, /images/clinic-room-1200.webp 1200w", alt: "Sala odontológica iluminada com cadeira de atendimento." },
  { label: "Ambiente", title: "O cuidado está nos detalhes.", copy: "Conheça o ambiente que inspira esta demonstração.", image: "/images/clinic-detail-800.webp", srcSet: "/images/clinic-detail-400.webp 400w, /images/clinic-detail-800.webp 800w", alt: "Detalhe dos equipamentos de um consultório odontológico." },
  { label: "Agendamento", title: "O próximo passo, no seu tempo.", copy: "Escolha um horário, confira os dados e envie sua solicitação à equipe.", image: "/images/clinic-room-800.webp", srcSet: "/images/clinic-room-480.webp 480w, /images/clinic-room-800.webp 800w, /images/clinic-room-1200.webp 1200w", alt: "Vista ampla de um consultório odontológico." },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("maria-alice-theme") === "dark"; }
    catch { return false; }
  });
  const [playing, setPlaying] = useState(() =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovered, setHovered] = useState(false);
  const rotating = playing && !hovered;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => {
      setSlideIndex((index) => (index + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [rotating, slideIndex]);
  const slide = HERO_SLIDES[slideIndex];
  const moveSlide = (direction: number) => setSlideIndex((index) =>
    (index + direction + HERO_SLIDES.length) % HERO_SLIDES.length,
  );
  const toggleTheme = () => {
    setDark(!dark);
    try { localStorage.setItem("maria-alice-theme", dark ? "light" : "dark"); }
    catch { /* The toggle remains usable when storage is unavailable. */ }
  };
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const hero = useRef<HTMLElement>(null);
  const header = useRef<HTMLElement>(null);
  const notice = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = hero.current;
    if (!section) return;
    const updateInset = () => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      section.style.setProperty("--hero-top", `${top}px`);
    };
    const observer = new ResizeObserver(updateInset);
    const demoBar = isUxDemo ? document.querySelector(".ux-demo-bar") : null;
    for (const element of [header.current, notice.current, demoBar]) {
      if (element) observer.observe(element);
    }
    updateInset();
    window.addEventListener("resize", updateInset);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateInset);
    };
  }, []);

  const teamPath = isUxDemo ? "/agenda" : "/login";
  useEffect(() => {
    // The route loads lazily; the browser may resolve an incoming anchor before its section exists.
    const target = window.location.hash.slice(1);
    if (target) document.getElementById(target)?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <div
      className="landing"
      data-theme={dark ? "dark" : "light"}
      id="inicio"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div ref={notice} className="landing-demo">
        Clínica fictícia · Demonstração sem atendimento real
      </div>
      <header ref={header} className="landing-nav-bar">
        <div className="landing-wrap landing-nav-inner">
          <Link
            to="/"
            className="landing-brand"
            aria-label="Maria Alice, início"
          >
            <img
              src={LOGO}
              width="256"
              height="256"
              alt=""
            />
            <span><strong>Maria Alice</strong><small>Odontologia especializada</small></span>
          </Link>
          <nav className="landing-menu" aria-label="Navegação principal">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="landing-nav-actions">
            <button type="button" className="landing-theme-toggle" aria-label="Tema escuro" aria-pressed={dark} onClick={toggleTheme}>
              {dark ? "Claro" : "Escuro"}
            </button>
            <Link
              to={teamPath}
              reloadDocument={isUxDemo}
              className="landing-team"
            >
              Acesso da equipe <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <button
              ref={toggle}
              type="button"
              className="landing-menu-toggle"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X aria-hidden="true" />
              ) : (
                <Menu aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <nav
          id={menuId}
          className="landing-mobile-panel"
          hidden={!menuOpen}
          aria-label="Menu móvel"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link to={bookingPath} onClick={() => setMenuOpen(false)}>
            Agendar avaliação
          </Link>
          <Link to={teamPath} reloadDocument={isUxDemo}>
            Acesso da equipe
          </Link>
        </nav>
      </header>
      <main id="conteudo">
        <section ref={hero} className="landing-hero" aria-roledescription="carrossel" aria-label="Apresentação da clínica"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget) &&
                event.currentTarget.matches(":has(:focus-visible)")) {
              setPlaying(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              moveSlide(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}>
          <figure className="landing-hero-media">
            <img key={slideIndex} src={slide.image} srcSet={slide.srcSet}
              sizes="100vw"
              width="1200" height="1000" fetchPriority={slideIndex === 0 ? "high" : "auto"}
              alt={slide.alt} />
            <figcaption>Imagem ilustrativa · Pavel Danilyuk / Pexels</figcaption>
          </figure>
          <div className="landing-hero-copy">
            <div aria-live={rotating ? "off" : "polite"} aria-atomic="true">
            <div key={slideIndex} className="landing-slide-copy">
              <p className="landing-intro">{slide.label}</p>
              <h1>{slide.title}</h1>
              <p>{slide.copy}</p>
            </div>
            </div>
            <Link to={bookingPath} className="landing-btn landing-btn-primary">
              Agendar avaliação <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <p className="landing-hero-note">A confirmação depende do aceite da equipe.</p>
          </div>
          <div className="landing-slide-controls" role="group" aria-label="Controles do carrossel">
            <button type="button"
              aria-label={playing ? "Pausar carrossel" : "Reproduzir carrossel"}
              onClick={() => setPlaying(!playing)}>
              <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
            </button>
            <button type="button" aria-label="Slide anterior" onClick={() => moveSlide(-1)}>‹</button>
            {HERO_SLIDES.map((item, index) => (
              <button type="button" key={item.label} className="landing-slide-dot"
                aria-label={item.label} aria-current={index === slideIndex ? "true" : undefined}
                onClick={() => setSlideIndex(index)}><span /></button>
            ))}
            <button type="button" aria-label="Próximo slide" onClick={() => moveSlide(1)}>›</button>
          </div>
        </section>
        <section
          id="avaliacao"
          className="landing-section landing-evaluation-section"
        >
          <div className="landing-wrap landing-evaluation">
            <div className="landing-evaluation-heading">
              <h2>Primeiro, entender você.</h2>
              <p>
                A avaliação abre espaço para conversar sobre suas necessidades e
                os próximos passos com um profissional.
              </p>
            </div>
            <div className="landing-evaluation-note">
              <h3>Uma escolha de cada vez.</h3>
              <p>
                Você escolhe o profissional, a data e o horário. Depois, confere
                tudo antes de enviar o pedido à equipe.
              </p>
              <p>
                Valores e condições dependem de avaliação. Não há pagamento
                online nesta etapa.
              </p>
              <a href="#como-funciona">
                Veja como solicitar{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
        <section id="como-funciona" className="landing-section landing-wrap">
          <div className="landing-section-heading">
            <h2>
              Do primeiro passo
              <br />
              ao pedido enviado.
            </h2>
            <p>Um caminho curto, com espaço para conferir cada detalhe.</p>
          </div>
          <ol className="landing-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="landing-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section id="clinica" className="landing-section landing-about-section">
          <div className="landing-wrap landing-about">
            <figure className="landing-about-photo">
              <img
                src="/images/clinic-detail-800.webp"
                srcSet="/images/clinic-detail-400.webp 400w, /images/clinic-detail-800.webp 800w"
                sizes="(min-width: 900px) 400px, (min-width: 600px) 50vw, calc(100vw - 40px)"
                width="800"
                height="1000"
                loading="lazy"
                decoding="async"
                alt="Detalhe de uma sala de atendimento odontológico; fotografia de banco de imagens."
              />
              <figcaption>
                Imagem ilustrativa · Pavel Danilyuk / Pexels
              </figcaption>
            </figure>
            <div className="landing-about-copy">
              <h2>
                O cuidado está
                <br />
                nos detalhes.
              </h2>
              <p>
                Da escolha do horário à organização da agenda, este projeto
                explora uma experiência mais clara para pacientes e equipe.
              </p>
              <p>
                Maria Alice é uma clínica fictícia. Os profissionais, serviços e
                horários da demonstração são exemplos. As fotografias ilustram o
                ambiente e serão substituídas por imagens da clínica quando
                disponíveis.
              </p>
              <Link to={bookingPath} className="landing-text-link">
                Explorar o agendamento{" "}
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <section id="duvidas" className="landing-section landing-wrap">
          <div className="landing-section-heading">
            <h2>Dúvidas frequentes.</h2>
            <p>O que você precisa saber antes de solicitar uma avaliação.</p>
          </div>
          <div className="landing-faq">
            {FAQ.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="contato"
          className="landing-contact landing-wrap"
          aria-labelledby="contact-title"
        >
          <div>
            <h2 id="contact-title">
              Informação clara,
              <br />
              desde o primeiro contato.
            </h2>
            <p>
              Esta demonstração não possui telefone, endereço ou redes sociais
              de atendimento. Os canais oficiais serão publicados após
              validação.
            </p>
          </div>
          <a href="#duvidas" className="landing-btn landing-btn-secondary">
            Consultar dúvidas frequentes
          </a>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-grid">
          <div className="landing-footer-brand">
            <img
              src={LOGO}
              width="256"
              height="256"
              alt="Maria Alice Odontologia Especializada"
            />
            <p>
              Uma experiência de cuidado,
              <br />
              desde a primeira escolha.
            </p>
            <small>
              Projeto demonstrativo.
              <br />
              Use somente dados fictícios.
            </small>
          </div>
          <nav aria-label="Sobre a clínica">
            <h2>A clínica</h2>
            <a href="#avaliacao">A avaliação</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#clinica">Sobre o projeto</a>
          </nav>
          <nav aria-label="Agendamento e ajuda">
            <h2>Agendamento e ajuda</h2>
            <Link to={bookingPath}>Solicitar uma avaliação</Link>
            <a href="#duvidas">Dúvidas frequentes</a>
            <Link to={teamPath} reloadDocument={isUxDemo}>
              Acesso da equipe
            </Link>
          </nav>
          <div>
            <h2>Contato e informações</h2>
            <a href="#contato">Canais de atendimento</a>
            <a href="#informacoes">Privacidade e termos</a>
            <a
              href="https://www.pexels.com/photo/a-dental-equipment-in-the-clinic-6812453/"
              rel="noreferrer"
            >
              Fotografias: Pavel Danilyuk / Pexels{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="landing-wrap landing-footer-bottom" id="informacoes">
          <div>
            <p>Maria Alice · Clínica fictícia, sem atendimento real.</p>
            <p>
              Política de Privacidade e Termos de Serviço em preparação para
              revisão. Esta versão é destinada a testes locais com dados
              fictícios.
            </p>
          </div>
          <a href="#inicio">
            Voltar ao topo <ArrowUp size={16} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}
