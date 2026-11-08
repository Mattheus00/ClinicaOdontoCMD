import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { isAxiosError } from "axios";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { ExperienceTheme } from "../../components/ExperienceTheme";
import DatePicker from "../../components/DatePicker";
import {
  usePublicAvailability,
  usePublicBook,
  usePublicBookingPage,
} from "../../features/booking/api";
import { maskPhone } from "../../lib/masks";
import { money } from "../../lib/money";
import { clinicDate, clinicTime, clinicDateLabel } from "../../lib/clinic-time";
import "./PublicBookingPage.css";

const steps = ["Consulta", "Horário", "Seus dados", "Revisão"];
export default function PublicBookingPage() {
  const { slug } = useParams();
  const page = usePublicBookingPage(slug);
  const book = usePublicBook(slug);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [date, setDate] = useState(() => clinicDate());
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(0);
  const availability = usePublicAvailability(
    slug,
    step >= 1 ? professionalId : "",
    date,
  );
  const procedure = page.data?.procedures.find(
    (item) => item.id === procedureId,
  );
  const professional = page.data?.professionals.find(
    (item) => item.id === professionalId,
  );
  const lastDate = new Date(`${clinicDate()}T12:00:00Z`);
  lastDate.setUTCDate(lastDate.getUTCDate() + 60);
  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error]);
  useEffect(() => {
    if (step !== previousStep.current) {
      titleRef.current?.focus();
      previousStep.current = step;
    }
  }, [step]);
  useEffect(() => {
    if (book.isSuccess) titleRef.current?.focus();
  }, [book.isSuccess]);
  const go = (next: number) => {
    setError("");
    setStep(next);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (book.isPending) return;
    setError("");
    if (step === 0 && (!procedureId || !professionalId)) {
      setError("Escolha o serviço e o profissional para continuar.");
      return;
    }
    if (step === 1 && !startsAt) {
      setError("Escolha um horário disponível para continuar.");
      return;
    }
    if (
      step === 2 &&
      (name.trim().length < 2 || phone.replace(/\D/g, "").length < 10)
    ) {
      setError("Informe seu nome e um telefone com DDD para contato.");
      return;
    }
    if (step < 3) {
      go(step + 1);
      return;
    }
    if (!startsAt) {
      setError("Escolha outro horário antes de enviar.");
      setConflict(true);
      return;
    }
    book.mutate(
      {
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        professionalId,
        procedureId,
        startsAt,
      },
      {
        onError: (failure) => {
          const occupied =
            isAxiosError(failure) && failure.response?.status === 409;
          setConflict(occupied);
          if (occupied) {
            setStartsAt("");
            void availability.refetch();
          }
          setError(
            occupied
              ? "Este horário acabou de ser ocupado. Seus dados foram mantidos. Escolha outro horário."
              : (isAxiosError(failure) && failure.response?.data?.message) ||
                  "Não foi possível enviar. Seus dados foram mantidos. Tente novamente.",
          );
        },
      },
    );
  };
  return (
    <main className="public-booking">
      <header className="booking-topbar">
        <Link to="/" className="booking-brand">
          <img
            src="/brand/velora-logo.webp"
            alt="Velora"
            width="48"
            height="48"
          />
        </Link>
        <span>Agendamento online</span>
        <ExperienceTheme />
      </header>
      {!slug ? (
        <section className="booking-message">
          <CalendarDays size={36} />
          <h1>Vamos encontrar seu atendimento</h1>
          <p>
            Para consultar os profissionais e horários, abra o link de
            agendamento compartilhado pela clínica.
          </p>
          <Link to="/" className="btn btn-secondary">
            Voltar ao início
          </Link>
        </section>
      ) : page.isLoading ? (
        <div className="booking-message">
          <LoadingState />
        </div>
      ) : page.isError || !page.data ? (
        <div className="booking-message">
          <ErrorState
            message="Não foi possível abrir este link. Confira o endereço enviado pela clínica e tente novamente."
            onRetry={() => page.refetch()}
          />
          <Link to="/">Voltar ao início</Link>
        </div>
      ) : book.isSuccess && book.data ? (
        <section className="booking-message booking-success">
          <CheckCircle2 size={48} />
          <p className="booking-kicker">Próximo passo: aguardar o aceite</p>
          <h1 ref={titleRef} tabIndex={-1}>
            Solicitação enviada
          </h1>
          <p>
            Obrigado, {book.data.patientName}. A equipe de{" "}
            {book.data.clinicName} recebeu seu pedido e vai analisar a
            disponibilidade.
          </p>
          <dl>
            <div>
              <dt>Profissional</dt>
              <dd>{book.data.professionalName}</dd>
            </div>
            <div>
              <dt>Serviço</dt>
              <dd>{book.data.procedureName}</dd>
            </div>
            <div>
              <dt>Horário solicitado</dt>
              <dd>
                {clinicDateLabel(clinicDate(book.data.startsAt))} às{" "}
                {clinicTime(book.data.startsAt)}
              </dd>
            </div>
          </dl>
          <p className="booking-notice">
            O envio ainda não confirma o atendimento. Aguarde o retorno da
            equipe.
          </p>
          <Link className="btn btn-secondary" to="/">
            Voltar ao início
          </Link>
        </section>
      ) : (
        <div className="booking-layout">
          <div className="booking-main">
            <Link to="/" className="booking-back">
              <ArrowLeft size={16} /> Voltar ao início
            </Link>
            <p className="booking-kicker">
              {page.data.clinicName} · Seu próximo cuidado
            </p>
            <h1>Um horário para você.</h1>
            <p className="booking-intro">
              Escolha com calma. Confira tudo antes de enviar.
            </p>
            {!page.data.professionals.length || !page.data.procedures.length ? (
              <EmptyState
                title="Agendamento temporariamente indisponível"
                description="A clínica ainda não disponibilizou serviços ou profissionais para agendar online."
              />
            ) : (
              <>
                <nav
                  className="booking-progress"
                  aria-label="Etapas do agendamento"
                >
                  <ol>
                    {steps.map((label, i) => (
                      <li key={label}>
                        <button
                          type="button"
                          disabled={i > step || book.isPending}
                          aria-current={i === step ? "step" : undefined}
                          onClick={() => go(i)}
                        >
                          <span>{i < step ? <Check size={15} /> : i + 1}</span>
                          <strong>{label}</strong>
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
                <form
                  className="booking-form"
                  onSubmit={submit}
                  aria-busy={book.isPending}
                >
                  <div className="booking-step-heading">
                    <span>Etapa {step + 1} de 4</span>
                    <h2 ref={titleRef} tabIndex={-1}>
                      {
                        [
                          "Qual cuidado você procura?",
                          "Qual horário funciona melhor?",
                          "Como podemos falar com você?",
                          "Confira sua solicitação",
                        ][step]
                      }
                    </h2>
                  </div>
                  {step === 0 && (
                    <div className="booking-fields">
                      <fieldset className="booking-services">
                        <legend>Serviço</legend>
                        {page.data.procedures.map((item) => (
                          <label
                            className={`booking-service ${procedureId === item.id ? "is-selected" : ""}`}
                            key={item.id}
                          >
                            <input
                              type="radio"
                              name="procedure"
                              value={item.id}
                              checked={procedureId === item.id}
                              onChange={() => {
                                setProcedureId(item.id);
                                setStartsAt("");
                              }}
                              required
                            />
                            <span>
                              <strong>{item.name}</strong>
                              <small>Valor de referência</small>
                            </span>
                            <b>{money(item.price)}</b>
                          </label>
                        ))}
                      </fieldset>
                      <label className="booking-label">
                        Profissional
                        <select
                          aria-label="Profissional"
                          className="input-field"
                          value={professionalId}
                          onChange={(e) => {
                            setProfessionalId(e.target.value);
                            setStartsAt("");
                          }}
                          required
                        >
                          <option value="">Escolha um profissional</option>
                          {page.data.professionals.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                              {item.specialty ? ` · ${item.specialty}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {step === 1 && (
                    <div className="booking-fields">
                      <p className="booking-timezone">
                        <Clock3 size={16} /> Horários de Brasília (São Paulo)
                      </p>
                      <div className="booking-date">
                        <span>Data do atendimento</span>
                        <DatePicker
                          key={date.slice(0, 7)}
                          value={date}
                          min={clinicDate()}
                          max={lastDate.toISOString().slice(0, 10)}
                          today={clinicDate()}
                          onChange={(value) => {
                            setDate(value);
                            setStartsAt("");
                          }}
                        />
                      </div>
                      <label className="booking-label">
                        Ou digite a data
                        <input
                          className="input-field"
                          type="date"
                          value={date}
                          min={clinicDate()}
                          max={lastDate.toISOString().slice(0, 10)}
                          onChange={(event) => {
                            if (event.target.value) {
                              setDate(event.target.value);
                              setStartsAt("");
                            }
                          }}
                        />
                      </label>
                      {availability.isFetching ? (
                        <p role="status" className="booking-notice">
                          Consultando horários disponíveis…
                        </p>
                      ) : availability.isError ? (
                        <ErrorState
                          message="Não foi possível consultar os horários. Tente novamente."
                          onRetry={() => availability.refetch()}
                        />
                      ) : availability.data?.slots.length ? (
                        <fieldset className="booking-times">
                          <legend>Horários disponíveis</legend>
                          {availability.data.slots.map((slot) => (
                            <label
                              className={startsAt === slot ? "is-selected" : ""}
                              key={slot}
                            >
                              <input
                                type="radio"
                                name="time"
                                checked={startsAt === slot}
                                onChange={() => {
                                  setStartsAt(slot);
                                  setConflict(false);
                                  setError("");
                                }}
                                required
                              />
                              <span>{clinicTime(slot)}</span>
                            </label>
                          ))}
                        </fieldset>
                      ) : (
                        <p className="booking-notice" role="status">
                          Nenhum horário disponível neste dia. Escolha outra
                          data.
                        </p>
                      )}
                    </div>
                  )}
                  {step === 2 && (
                    <div className="booking-fields">
                      <p className="booking-help">
                        Usaremos estes dados para identificar sua solicitação e
                        entrar em contato.
                      </p>
                      <label className="booking-label">
                        Nome completo
                        <input
                          className="input-field"
                          name="name"
                          autoComplete="name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </label>
                      <label className="booking-label">
                        Telefone / WhatsApp
                        <input
                          className="input-field"
                          name="tel"
                          type="tel"
                          autoComplete="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(maskPhone(e.target.value))}
                          placeholder="(11) 99999-9999"
                        />
                      </label>
                      <label className="booking-label">
                        E-mail (opcional)
                        <input
                          className="input-field"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="booking-review">
                      <div>
                        <div>
                          <span>Consulta</span>
                          <strong>{procedure?.name}</strong>
                          <p>{professional?.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => go(0)}
                          disabled={book.isPending}
                        >
                          Editar consulta
                        </button>
                      </div>
                      <div>
                        <div>
                          <span>Horário solicitado</span>
                          <strong>{clinicDateLabel(date)}</strong>
                          <p>
                            {startsAt
                              ? `${clinicTime(startsAt)} · Horário de Brasília`
                              : "Escolha outro horário"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => go(1)}
                          disabled={book.isPending}
                        >
                          Editar horário
                        </button>
                      </div>
                      <div>
                        <div>
                          <span>Seus dados</span>
                          <strong>{name}</strong>
                          <p>
                            {phone}
                            {email && (
                              <>
                                <br />
                                {email}
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => go(2)}
                          disabled={book.isPending}
                        >
                          Editar dados
                        </button>
                      </div>
                      <p className="booking-notice">
                        Sua solicitação aguarda o aceite da equipe. Não há
                        pagamento online nesta etapa.
                      </p>
                    </div>
                  )}
                  {error && (
                    <div
                      ref={alertRef}
                      tabIndex={-1}
                      role="alert"
                      className="booking-error"
                    >
                      <p>{error}</p>
                      {conflict && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => go(1)}
                        >
                          Escolher outro horário
                        </button>
                      )}
                    </div>
                  )}
                  <div className="booking-form-actions">
                    {step > 0 ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={book.isPending}
                        onClick={() => go(step - 1)}
                      >
                        <ArrowLeft size={16} /> Voltar
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={
                        book.isPending ||
                        (step === 1 &&
                          (!startsAt ||
                            availability.isFetching ||
                            availability.isError)) ||
                        (step === 3 && conflict)
                      }
                    >
                      {book.isPending
                        ? "Enviando…"
                        : step === 3
                          ? "Enviar solicitação"
                          : step === 2
                            ? "Revisar solicitação"
                            : "Continuar"}
                      {step < 3 && <ArrowRight size={16} />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
          <aside className="booking-summary" aria-label="Resumo da solicitação">
            <div className="booking-summary-icon">
              <CalendarDays size={24} />
            </div>
            <p className="booking-kicker">Seu atendimento</p>
            <h2>
              Cuidado começa
              <br />
              com clareza.
            </h2>
            <dl>
              <div>
                <dt>Serviço</dt>
                <dd>{procedure?.name || "Escolha o serviço"}</dd>
              </div>
              <div>
                <dt>Profissional</dt>
                <dd>{professional?.name || "Escolha o profissional"}</dd>
              </div>
              <div>
                <dt>Horário</dt>
                <dd>
                  {startsAt
                    ? `${clinicDateLabel(date)} · ${clinicTime(startsAt)}`
                    : "Escolha data e horário"}
                </dd>
              </div>
              {procedure && (
                <div>
                  <dt>Valor de referência</dt>
                  <dd>{money(procedure.price)}</dd>
                </div>
              )}
            </dl>
            <div className="booking-summary-note">
              <ShieldCheck size={20} />
              <p>
                Você revisa tudo antes de enviar. O atendimento depende do
                aceite da equipe.
              </p>
            </div>
          </aside>
        </div>
      )}
      <footer className="booking-footer">
        Velora · Gestão elegante para clínicas{" "}
        <span>Um passo de cada vez.</span>
      </footer>
    </main>
  );
}
