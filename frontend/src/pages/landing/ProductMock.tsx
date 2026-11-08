/** Static product UI frame for the landing — mirrors the Velora dashboard look. */

type ProductMockProps = {
  variant?: "hero" | "product" | "detail";
  className?: string;
};

export function ProductMock({ variant = "hero", className = "" }: ProductMockProps) {
  if (variant === "detail") {
    return (
      <div className={`product-mock product-mock-detail ${className}`.trim()} aria-hidden="true">
        <div className="product-mock-chrome">
          <span /><span /><span />
        </div>
        <div className="product-mock-detail-body">
          <aside>
            <strong>Paciente</strong>
            <em>Ana Ribeiro</em>
            <p>Cadastro · Anamnese · Odontograma</p>
          </aside>
          <div>
            <header>
              <span>Odontograma</span>
              <span>Atualizado hoje</span>
            </header>
            <div className="product-mock-teeth">
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} className={i === 4 || i === 11 ? "is-marked" : undefined} />
              ))}
            </div>
            <ul>
              <li><span>14</span><p>Restauração · concluído</p></li>
              <li><span>26</span><p>Avaliação · em acompanhamento</p></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-mock product-mock-${variant} ${className}`.trim()} aria-hidden="true">
      <div className="product-mock-chrome">
        <span /><span /><span />
        <strong>Velora · Agenda</strong>
      </div>
      <div className="product-mock-layout">
        <aside className="product-mock-nav">
          <b>V</b>
          <i className="is-on" />
          <i />
          <i />
          <i />
          <i />
        </aside>
        <div className="product-mock-main">
          <header className="product-mock-bar">
            <div>
              <em>Agenda</em>
              <span>Semana atual</span>
            </div>
            <button type="button">Novo</button>
          </header>
          <div className="product-mock-grid">
            <div className="product-mock-day">
              <span>Seg</span>
              <article><b>09:00</b><p>Avaliação · Marina</p></article>
              <article className="is-soft"><b>11:30</b><p>Retorno · Paulo</p></article>
            </div>
            <div className="product-mock-day">
              <span>Ter</span>
              <article className="is-accent"><b>10:00</b><p>Clareamento · Lia</p></article>
              <article><b>14:00</b><p>Consulta · André</p></article>
            </div>
            <div className="product-mock-day">
              <span>Qua</span>
              <article><b>08:30</b><p>Limpeza · Sofia</p></article>
              <article className="is-soft"><b>16:00</b><p>Aguardando aceite</p></article>
            </div>
            {variant === "product" ? (
              <div className="product-mock-day">
                <span>Qui</span>
                <article><b>09:30</b><p>Canal · Helena</p></article>
                <article className="is-accent"><b>15:00</b><p>Ortodontia · Rui</p></article>
              </div>
            ) : null}
          </div>
          <footer className="product-mock-metrics">
            <div><span>Hoje</span><strong>7</strong></div>
            <div><span>Aguardando</span><strong>3</strong></div>
            <div><span>Confirmados</span><strong>12</strong></div>
          </footer>
        </div>
      </div>
    </div>
  );
}
