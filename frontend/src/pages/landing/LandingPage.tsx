import { useEffect, useId, useState } from 'react';
import { Camera, Eye, Globe, Mail, MapPin, Menu, Microscope, Phone, Settings2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LOGO = '/brand/maria-alice-logo.png';

const NAV = [
  { href: '#tratamentos', label: 'Tratamentos' },
  { href: '#tecnologia', label: 'Tecnologia' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#contato', label: 'Contato' },
];

const TREATMENTS = [
  {
    title: 'Facetas em Porcelana Artesanais',
    description:
      'Lâminas personalizadas com precisão para harmonizar forma, cor e alinhamento, preservando a naturalidade e a integridade estrutural.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDkMGfDTIqdsjKqUcWeZtdftWcEDmNDf6gjhW-PDClaQJL6OQ5JxSUmIM4lh5iMPGRiXMQxaHUJnn-a245Rsvwq7M_7EeYeUkFaVY0XqbU5D_XvlW91D3OX1C23pWdHZkTZqWQ8RFakcNIiRlV-Qc7UjjiUC738khN5wTqB1PAfcKfAiDslu3frl6-SfCq6jwa_462-U9qz3s-58Z9Y7B5_ZG_vreL8YSErPLI_FAaycTAW5bIrhrvSPM57mbBNMQQJ_ydJQqNC2E0',
    cta: 'Conhecer facetas',
  },
  {
    title: 'Invisalign® Avançado',
    description:
      'Ortodontia discreta com planejamento digital 3D para um caminho confortável e invisível até o sorriso ideal.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoNYAfGerOyxqlqW3_t5EvsOVGgQpOWyrotLoB4S4gbGGExFDZNG-b2naJS9jHLpD8KTaMdDDTYMNbqtAzbH14jBcXAu1hDv2nfOyxrmJlK17fIwtXuaWXKGRzu3pZ5QtUQ-i9UnkakGdSssB7Wz-vwAc7R0kQWfhUyBGUqkKrhRItjquq4_Lld66ceo31NVuWiNFxCYcJN37NwO2sri265WUFn_aEnrVt675D-HJoXw2WZdWBdFJim-TW913y0m7udhpxDbAx880',
    cta: 'Descobrir Invisalign',
  },
];

const TECH_FEATURES = [
  {
    icon: Microscope,
    title: 'Escaneamento intraoral 3D',
    text: 'Moldagens digitais de alta precisão, sem o desconforto dos moldes tradicionais.',
  },
  {
    icon: Eye,
    title: 'Simulação do sorriso',
    text: 'Visualize o resultado final antes mesmo da primeira sessão de tratamento.',
  },
  {
    icon: Settings2,
    title: 'Restauração CAD/CAM',
    text: 'Design e fresagem internos para coroas e facetas com precisão no mesmo dia.',
  },
];

const GALLERY = [
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBX99VjoN03pZxCZEGoQ5C-SRmAOs7gOs2YxNoUAyHqdKwtmSmSfo4rTfYbfgmLtp-HI0YmKfryYk0Xtr-wogGfN0MoMAb06pKPjO4u47P3SDfi6CxJmfQ1O8kyd6x712B2JV3uZKBj7_3CoMovW7ib-nUOIpvOWMPaWBgRc5Z9LyDuR-EMs7gDFM6Q3k4Nno0CL77UBf_AXxYouX8sShOT0d4M0NYPGGKPiyaOPoKFdeCnysAw2pXkx8cNMvA-x3KU3hTlb4o6KjQ',
    label: 'Caso 042',
    className: 'gallery-item--hero',
  },
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHzbhwa-M2Dsfltcg3g4Sd7w4tAOOPwCrTfAhR3kQbaBp_qM6jBKIbhy4M2kXA4C9jsM5uM2O08GNTgkRuVUGEYTj6D-_C2wAOolxnPUoOsNxiTV_Qht1iFOo88V8vUHkHAiaVgqCjO-wLdJoMEB4lt5XANzq-L8mv5wYS_eHguutQBMp8d5eHlB7GaEf4q8KVo3mzxW2BMOOlkHwlvnfnVHRsCQ6hMtUmKB3vwVw2zHrn-LdyrPFdGWdxaRzAfwgn7JUiHlFq31Y',
    className: 'gallery-item--sm',
  },
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyaIFUPt2QrxKNgrDuvJermTY1ys8_YYSjJ39JDelutsw0DgKsmCZSzSCUgF81Dsyvye68w0JHg3OhwnvYUTBaqu22WFVd1aY6AbIiuib2RQcOQxFVuE45_FEon3uFoGvYI4lXpRe3MZbVMeT9bzjHHTgOtaPk13lM15g9xxp-JVTtav5fA5UyqEvQHT8962olPsOZrcA1lKbF_wDOq4ZYWkoUAfnPHDYCKcl14dCOvEAwLyuAPqCHdbY6SIMCPC75JOtAMqPYBkk',
    className: 'gallery-item--tall',
  },
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCh7N_RNHz5e6hmDCqzRJFOETXZ7ctLP43ETrjlfOHhAPLi-F1cWR9a5N3-ih9JLkke7l7K41DtTKig3RnA8_lBhlg4Z3o79vDtfvcLqHkuny0VQ6WZ1pjls8-PWcZK_JD70nRvd9bYunS8O0XvG8qdcRieZfI-vt-ZNhSocoXERZZqiDuVrkJvTQH8__VbniXfeYyUwigIjDOCb4e3HcMhWFFkGbVN1USk4JF7JuXxFxOHg8jjMADWHN-YV4N9KvnHn51YqF0xsAs',
    className: 'gallery-item--sm',
  },
];

const FOOTER_LINKS = ['Política de privacidade', 'Termos de uso', 'Código de ética', 'Suporte'];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 769px)').matches) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={`landing${menuOpen ? ' is-menu-open' : ''}`}>
      <header className="landing-nav-bar">
        <div className="landing-wrap landing-nav-inner">
          <Link to="/" className="landing-brand" onClick={closeMenu}>
            <img src={LOGO} alt="Maria Alice Odontologia Especializada" />
          </Link>

          <nav className="landing-menu" aria-label="Navegação principal">
            {NAV.map((item, index) => (
              <a key={item.href} href={item.href} className={index === 0 ? 'is-active' : undefined}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="landing-nav-actions">
            <Link to="/login" className="landing-btn landing-btn-outline landing-portal-link">
              Área da clínica
            </Link>
            <a href="#contato" className="landing-btn landing-btn-primary" onClick={closeMenu}>
              Fale conosco
            </a>
            <button
              type="button"
              className="landing-menu-toggle"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={`landing-mobile-panel${menuOpen ? ' is-open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <nav className="landing-mobile-nav" aria-label="Menu mobile">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="landing-mobile-actions">
            <Link to="/login" className="landing-btn landing-btn-primary" onClick={closeMenu}>
              Área da clínica
            </Link>
            <a href="#contato" className="landing-btn landing-btn-outline" onClick={closeMenu}>
              Fale conosco
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-panel">
            <div className="landing-hero-copy">
              <span className="landing-kicker">Arquitetura do sorriso de alto padrão</span>
              <h1>
                Elevando a excelência odontológica à <em>precisão artística.</em>
              </h1>
              <p>
                Uma experiência clínica boutique onde tecnologia 3D de ponta encontra o toque refinado
                do design artesanal de sorrisos.
              </p>
              <div className="landing-hero-buttons">
                <a href="#tratamentos" className="landing-btn landing-btn-primary">
                  Ver tratamentos exclusivos
                </a>
                <a href="#tecnologia" className="landing-btn landing-btn-outline">
                  Nossa tecnologia
                </a>
              </div>
            </div>

            <div className="landing-hero-media" aria-hidden="true">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXZ3KHfsZidIZQVQP-7Ghs0DI6CbbLq2JXNdK9fw9eOnyOmSPedMgAu0Z772AF9l9Mu7a3mRugEyWkIKEqXWrxFJOg4nuu9nTclIjt9RZPolbBbtagZxWUz8y1repQEqLGhXXGTKmaJJVpiZ8J6zblY_LZ0uZx83BK3Z3FbNbYsRMefFknIGbkwjajkjc3oApuAGONUgE_ZtWDj5QE5hcRWZpXgGpSutxizIJj481jSrtXSvmuJs8j4v36Cwal4nUGYJjk0iwWmw4"
                alt=""
              />
            </div>
          </div>
        </section>

        <section id="tratamentos" className="landing-section">
          <div className="landing-wrap">
            <div className="landing-section-title">
              <h2>Arquitetura do sorriso exclusiva</h2>
              <span className="landing-title-line" />
            </div>

            <div className="landing-treatments">
              {TREATMENTS.map((item) => (
                <article key={item.title} className="landing-treatment-card">
                  <div className="landing-treatment-media">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <div className="landing-treatment-overlay">
                      <span>{item.cta}</span>
                    </div>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tecnologia" className="landing-section landing-section-muted">
          <div className="landing-wrap landing-tech-grid">
            <div className="landing-tech-copy">
              <span className="landing-kicker">A vantagem digital</span>
              <h2>Planejamento digital do sorriso e integração 3D</h2>
              <ul className="landing-tech-list">
                {TECH_FEATURES.map(({ icon: Icon, title, text }) => (
                  <li key={title}>
                    <Icon size={28} strokeWidth={1.5} />
                    <div>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-tech-visual">
              <div className="landing-tech-ring" aria-hidden="true" />
              <figure>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXbClWrepNlPLCHgGj1IZQvp8FD9P2hN3utAnhcAlgkOqyqXpkl8L1JQ-K_HVaQt614NUurZh4ebE0eTO19k5qm-4tog7EbuLN-m6X-e43-Fj924jIdIDJW7vo8avQCW6NekbIrI4rolZDN4htBFE6fMRgCmwg8ALwDJUUjOQ8runEkaSgMjs7npxo4J8oYb3ujjybQi_Gh92twdUdXJzHnD1skXo2aOTp2Pjyh54tazbOhYUGihGQx2KXhjNHDtCId7j6NanPWVQ"
                  alt="Monitor com escaneamento dental 3D"
                  loading="lazy"
                />
              </figure>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-wrap landing-about-grid">
            <figure className="landing-about-photo">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIL63TFEv0hxaRvzU6dmpLgJP51jncFAyhxWe9rwK9qBC0CqSbZf3DrwUBP3GKFM8qPegVR6WWnRzjQJZUU0wyaI1DThD86doyI8GtBvicz_gi-kEytR2Qc5KBNyuHilWlFCcgwxDBvNqTPVJ6gm_NiPPTUnxcYleibGTPGUp28_ap47wSKMnVGNXptq-qODF_8Ps946ms3glSZuAUeJlp6gAZWpsDD7A8yEwwbCsW4odOHLCtr_5YKTAmfXCTPZ3T4wXdavEX538"
                alt="Dra. Maria Alice"
                loading="lazy"
              />
            </figure>

            <div className="landing-about-copy">
              <h2>
                Dra. Maria Alice
                <span>Arquiteta do sorriso</span>
              </h2>
              <p className="landing-about-lead">
                Com mais de 15 anos de experiência em odontologia restauradora e estética, a Dra.
                Maria Alice une expertise cirúrgica a um olhar artístico refinado.
              </p>
              <p>
                Sua filosofia centra-se na restauração conservadora: cada intervenção preserva ao
                máximo a estrutura natural do dente, alcançando resultados estéticos de padrão
                internacional.
              </p>
              <div className="landing-credentials">
                <div>
                  <strong>MSc em Odontologia</strong>
                  <span>Restauração estética</span>
                </div>
                <div>
                  <strong>Certificação internacional</strong>
                  <span>Odontologia estética</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="resultados" className="landing-section landing-section-dark">
          <div className="landing-wrap">
            <div className="landing-results-head">
              <div>
                <span className="landing-kicker landing-kicker-light">Resultados comprovados</span>
                <h2>A arte do resultado</h2>
              </div>
              <button type="button" className="landing-link-light">
                Ver todos os casos
              </button>
            </div>

            <div className="landing-gallery">
              {GALLERY.map((item, index) => (
                <figure key={index} className={`landing-gallery-item ${item.className}`}>
                  <img src={item.image} alt="" loading="lazy" />
                  {item.label && <figcaption>{item.label}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contato" className="landing-footer">
        <div className="landing-wrap landing-footer-grid">
          <div className="landing-footer-brand">
            <img src={LOGO} alt="Maria Alice Odontologia" />
            <p>
              Redefinindo a experiência odontológica com atendimento boutique e precisão cirúrgica.
            </p>
            <div className="landing-social">
              <a href="#" aria-label="Site">
                <Globe size={18} />
              </a>
              <a href="#" aria-label="Instagram">
                <Camera size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4>Contato</h4>
            <ul className="landing-contact-list">
              <li>
                <MapPin size={18} />
                <span>
                  Av. Paulista, 1000 — Sala 502
                  <br />
                  São Paulo, Brasil
                </span>
              </li>
              <li>
                <Phone size={18} />
                <span>+55 (11) 99999-0000</span>
              </li>
              <li>
                <Mail size={18} />
                <span>concierge@mariaalice.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4>Links rápidos</h4>
            <ul className="landing-footer-links">
              {FOOTER_LINKS.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
              <li>
                <Link to="/login">Área da clínica</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="landing-wrap landing-footer-bottom">
          <p>© {new Date().getFullYear()} Maria Alice Odontologia Especializada. Todos os direitos reservados.</p>
          <p>Designed for Excellence</p>
        </div>
      </footer>
    </div>
  );
}
