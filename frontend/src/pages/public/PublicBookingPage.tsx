import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import {
  usePublicAvailability,
  usePublicBook,
  usePublicBookingPage,
} from "../../features/booking/api";
import { clinicDate, clinicDateTime, clinicTime } from "../../lib/clinic-time";
import { isUxDemo } from "../../lib/experience";
import { money } from "../../lib/money";
import "./PublicBookingPage.css";

export default function PublicBookingPage() {
  const { slug } = useParams();
  const page = usePublicBookingPage(slug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [date, setDate] = useState(clinicDate());
  const [startsAt, setStartsAt] = useState("");
  const [review, setReview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recoverSlot, setRecoverSlot] = useState(false);
  const errorNotice = useRef<HTMLParagraphElement>(null);
  const slots = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (formError) errorNotice.current?.focus();
  }, [formError]);
  const heading = useRef<HTMLHeadingElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const procedureInput = useRef<HTMLSelectElement>(null);
  const editSection = (section: "consulta" | "horario" | "dados") => {
    setReview(false);
    requestAnimationFrame(() => {
      const input =
        section === "horario"
          ? dateInput.current
          : section === "dados"
            ? nameInput.current
            : procedureInput.current;
      input?.focus();
    });
  };
  const availability = usePublicAvailability(slug, professionalId, date);
  const book = usePublicBook(slug);
  const selectedProcedure = page.data?.procedures.find(
    (item) => item.id === procedureId,
  );
  const selectedProfessional = page.data?.professionals.find(
    (item) => item.id === professionalId,
  );
  const maxDate = new Date(`${clinicDate()}T12:00:00Z`);
  maxDate.setUTCDate(maxDate.getUTCDate() + 60);
  const focusHeading = () =>
    requestAnimationFrame(() => heading.current?.focus());
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setRecoverSlot(false);
    if (
      !startsAt ||
      !availability.data?.slots.includes(startsAt) ||
      date < clinicDate()
    ) {
      setFormError(
        "Escolha um horário disponível em uma data atual ou futura. Seus dados foram preservados.",
      );
      setReview(false);
      setRecoverSlot(true);
      return;
    }
    if (!review) {
      setReview(true);
      focusHeading();
      return;
    }
    book.mutate(
      {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        professionalId,
        procedureId,
        startsAt,
      },
      {
        onSuccess: focusHeading,
        onError: (error) => {
          const status = (error as { response?: { status?: number } }).response
            ?.status;
          setFormError(
            status === 409
              ? "Este horário acabou de ficar indisponível. Escolha outro horário; seus dados foram preservados."
              : "Não foi possível enviar a solicitação. Seus dados foram preservados. Tente novamente.",
          );
          if (status === 409) {
            setReview(false);
            setStartsAt("");
            setRecoverSlot(true);
            void availability.refetch();
          }
        },
      },
    );
  };
  return (
    <main className="public-booking">
      <div className="public-booking-shell">
        <Link className="public-booking-home" to="/">
          Voltar ao início
        </Link>
        <header className="public-booking-header">
          <img
            src="/brand/maria-alice-logo.webp"
            width="256"
            height="256"
            alt="Maria Alice Odontologia Especializada"
          />
          <div>
            <p className="public-booking-kicker">Agendamento online</p>
            <h1 ref={heading} tabIndex={-1}>
              {book.isSuccess
                ? "Solicitação enviada"
                : review
                  ? "Revise sua solicitação"
                  : "Agendar avaliação"}
            </h1>
            <p>
              {page.data?.clinicName ?? "Maria Alice Odontologia"} · Horários de
              Brasília (America/Sao_Paulo)
            </p>
          </div>
        </header>
        <p className="public-booking-notice">
          Demonstração sem atendimento real. Use apenas dados fictícios. O
          pedido depende de aceite da equipe.
        </p>
        {page.isLoading ? (
          <div className="public-booking-loading"><LoadingState /></div>
        ) : !slug ? (
          <EmptyState
            title="Link da clínica necessário"
            description="Abra o link de agendamento fornecido pela equipe. O endereço público desta clínica ainda não foi configurado."
          />
        ) : page.isError || !page.data ? (
          <ErrorState
            message="Não foi possível abrir este link de agendamento. Confira o endereço ou tente novamente."
            onRetry={() => page.refetch()}
          />
        ) : book.isSuccess && book.data ? (
          <section className="public-booking-success" role="status">
            <CheckCircle2 size={36} aria-hidden="true" />
            <h2>Pedido recebido, {book.data.patientName}.</h2>
            <p>
              O envio ainda não confirma o atendimento. Aguarde a análise da
              equipe.
            </p>
            <dl>
              <dt>Profissional</dt>
              <dd>{book.data.professionalName}</dd>
              <dt>Avaliação / procedimento</dt>
              <dd>{book.data.procedureName}</dd>
              <dt>Horário solicitado</dt>
              <dd>{clinicDateTime(book.data.startsAt)} (Brasília)</dd>
              <dt>Situação</dt>
              <dd>Aguardando aceite</dd>
            </dl>
            <Link to="/" className="btn btn-secondary">
              Voltar ao início
            </Link>
          </section>
        ) : !page.data.professionals.length || !page.data.procedures.length ? (
          <EmptyState
            title="Agendamento temporariamente indisponível"
            description="Ainda não há profissionais ou serviços disponíveis neste link."
          />
        ) : (
          <>
            <ol
              className="public-booking-progress"
              aria-label="Etapas do agendamento"
            >
              <li aria-current={!review ? "step" : undefined}>
                Escolher consulta
              </li>
              <li aria-current={review ? "step" : undefined}>
                Revisar e enviar
              </li>
            </ol>
            <form
              className="public-booking-form"
              onSubmit={submit}
              aria-busy={book.isPending}
            >
              <div hidden={review} className="public-booking-fields">
                <section>
                  <h2>Consulta e profissional</h2>
                  <label>
                    Avaliação / procedimento
                    <select
                      ref={procedureInput}
                      name="procedureId"
                      className="input-field"
                      value={procedureId}
                      onChange={(e) => setProcedureId(e.target.value)}
                      required
                    >
                      <option value="">Selecione</option>
                      {page.data.procedures.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedProcedure ? (
                    <p className="public-booking-hint">
                      {isUxDemo
                        ? "Valores dependem da avaliação. Nenhuma cobrança nesta demonstração."
                        : `Valor de referência informado pela clínica: ${money(selectedProcedure.price)}. Sem pagamento online.`}
                    </p>
                  ) : null}
                  <label>
                    Profissional
                    <select
                      className="input-field"
                      value={professionalId}
                      onChange={(e) => {
                        setProfessionalId(e.target.value);
                        setStartsAt("");
                      }}
                      required
                    >
                      <option value="">Selecione</option>
                      {page.data.professionals.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.specialty ? ` — ${item.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
                <section>
                  <h2>Data e horário</h2>
                  <label>
                    Data
                    <input
                      ref={dateInput}
                      name="date"
                      className="input-field"
                      type="date"
                      min={clinicDate()}
                      max={maxDate.toISOString().slice(0, 10)}
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setStartsAt("");
                      }}
                      required
                    />
                  </label>
                  <p className="public-booking-hint" id="slot-zone">
                    Horários de Brasília · America/Sao_Paulo
                  </p>
                  {!professionalId ? (
                    <p className="public-booking-state">
                      Selecione um profissional para ver os horários.
                    </p>
                  ) : availability.isFetching ? (
                    <p className="public-booking-state" role="status">
                      Carregando horários...
                    </p>
                  ) : availability.isError ? (
                    <div role="alert">
                      <p>Não foi possível carregar os horários.</p>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => availability.refetch()}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : availability.data?.slots.length ? (
                    <fieldset
                      className="public-booking-slots"
                      ref={slots}
                      aria-describedby="slot-zone"
                    >
                      <legend>Horários disponíveis</legend>
                      {availability.data.slots.map((slot) => (
                        <label
                          key={slot}
                          className={`public-booking-slot${startsAt === slot ? " is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="horario"
                            value={slot}
                            checked={startsAt === slot}
                            onChange={() => {
                              setStartsAt(slot);
                              if (recoverSlot) {
                                setFormError(null);
                                setRecoverSlot(false);
                              }
                            }}
                            required
                          />
                          {clinicTime(slot)}
                        </label>
                      ))}
                    </fieldset>
                  ) : (
                    <p className="public-booking-state" role="status">
                      Nenhum horário livre neste dia. Escolha outra data.
                    </p>
                  )}
                </section>
                <section className="public-booking-identification">
                  <h2>Identificação</h2>
                  <p className="public-booking-hint">
                    Informe somente dados fictícios. Não inclua informações de
                    saúde.
                  </p>
                  <label>
                    Nome completo
                    <input
                      ref={nameInput}
                      name="name"
                      className="input-field"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Telefone de contato
                    <input
                      className="input-field"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      maxLength={30}
                      aria-describedby="phone-hint"
                    />
                  </label>
                  <p className="public-booking-hint" id="phone-hint">
                    Contato exigido pelo fluxo atual para tratar a solicitação.{" "}
                    {isUxDemo
                      ? "Nenhuma mensagem é enviada pela simulação."
                      : ""}
                  </p>
                  <label>
                    E-mail (opcional)
                    <input
                      className="input-field"
                      type="email"
                      name="email"
                      spellCheck={false}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                    />
                  </label>
                </section>
              </div>
              {review ? (
                <section className="public-booking-review">
                  <h2>Confira antes de enviar</h2>
                  <dl>
                    <dt>Avaliação / procedimento</dt>
                    <dd>{selectedProcedure?.name}</dd>
                    <dt>Profissional</dt>
                    <dd>{selectedProfessional?.name}</dd>
                    <dt>Horário de Brasília</dt>
                    <dd>{clinicDateTime(startsAt)}</dd>
                    <dt>Nome</dt>
                    <dd>{name}</dd>
                    <dt>Telefone de contato</dt>
                    <dd>{phone}</dd>
                    {email ? (
                      <>
                        <dt>E-mail</dt>
                        <dd>{email}</dd>
                      </>
                    ) : null}
                  </dl>
                  <p>
                    O envio cria uma solicitação pendente de aceite, sem
                    confirmação imediata. Não há pagamento online.
                  </p>
                  <div
                    className="public-booking-edit-actions"
                    role="group"
                    aria-label="Alterar informações da solicitação"
                  >
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={book.isPending}
                      onClick={() => editSection("consulta")}
                    >
                      Alterar consulta
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={book.isPending}
                      onClick={() => editSection("horario")}
                    >
                      Alterar horário
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={book.isPending}
                      onClick={() => editSection("dados")}
                    >
                      Alterar dados
                    </button>
                  </div>
                </section>
              ) : null}
              {formError ? (
                <p ref={errorNotice} tabIndex={-1} className="public-booking-error" role="alert">
                  {formError}
                </p>
              ) : null}
              <div role="status" className="public-booking-update-status">
                {recoverSlot && (availability.isFetching
                  ? "Atualizando horários."
                  : availability.isSuccess ? "Horários disponíveis atualizados." : "")}
              </div>
              {recoverSlot && (
                <button type="button" className="btn btn-secondary" disabled={availability.isFetching}
                  onClick={() => (slots.current?.querySelector<HTMLInputElement>("input") ?? dateInput.current)?.focus()}>
                  Escolher outro horário
                </button>
              )}
              {!review && startsAt && availability.data?.slots.includes(startsAt) && (
                <p className="public-booking-hint">
                  <strong>Horário escolhido</strong> · {clinicDateTime(startsAt)} (Brasília)
                </p>
              )}
              <p className="public-booking-hint public-booking-legal">
                Política de Privacidade e Termos de Serviço pendentes de
                validação. Ambiente para avaliação local com dados fictícios.
              </p>
              <button
                className="btn btn-primary public-booking-submit"
                type="submit"
                disabled={
                  book.isPending ||
                  availability.isFetching ||
                  availability.isError
                }
              >
                {book.isPending
                  ? "Enviando..."
                  : review
                    ? "Enviar solicitação"
                    : "Revisar solicitação"}
              </button>
            </form>
          </>
        )}
        <aside
          className="public-booking-help"
          aria-label="Ajuda com o agendamento"
          hidden={page.isLoading}
        >
          <strong>Precisa esclarecer uma dúvida?</strong>
          <p>Veja como funciona o pedido e o aceite da equipe.</p>
          <a href="/#duvidas" target="_blank" rel="noopener noreferrer">
            Consultar dúvidas frequentes (nova aba)
          </a>
        </aside>
      </div>
    </main>
  );
}
