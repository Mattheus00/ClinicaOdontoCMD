import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Share2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { usePublicAvailability, usePublicBook, usePublicBookingPage } from '../../features/booking/api';
import { money } from '../../lib/money';
import './PublicBookingPage.css';

const LOGO = '/brand/maria-alice-logo.png';
const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

function clinicDateIso(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function todayIso() {
  return clinicDateIso();
}

function maxDateIso() {
  const today = clinicDateIso();
  const cursor = new Date(`${today}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + 60);
  return cursor.toISOString().slice(0, 10);
}

function formatSlotLabel(startsAt: string) {
  const time = startsAt.includes('T') ? startsAt.split('T')[1] : startsAt;
  return time.slice(0, 5);
}

function formatConfirmationDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function PublicBookingPage() {
  const { slug } = useParams();
  const page = usePublicBookingPage(slug);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [startsAt, setStartsAt] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const availability = usePublicAvailability(slug, professionalId, date);
  const book = usePublicBook(slug);

  const selectedProcedure = useMemo(
    () => page.data?.procedures.find((item) => item.id === procedureId) ?? null,
    [page.data?.procedures, procedureId],
  );

  if (page.isLoading) return <LoadingState />;
  if (page.isError || !page.data) {
    return (
      <main className="public-booking">
        <div className="public-booking-shell">
          <ErrorState
            message="Este link de agendamento não foi encontrado ou a clínica não está aceitando reservas online."
            onRetry={() => page.refetch()}
          />
          <Link className="public-booking-home" to="/">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  if (book.isSuccess && book.data) {
    return (
      <main className="public-booking">
        <div className="public-booking-shell public-booking-success">
          <CheckCircle2 size={42} />
          <h1>Solicitação enviada</h1>
          <p>
            Olá, <strong>{book.data.patientName}</strong>. Pedido recebido pela{' '}
            <strong>{book.data.clinicName}</strong>. A equipe vai analisar e confirmar o horário.
          </p>
          <ul>
            <li>
              <span>Dentista</span>
              <strong>{book.data.professionalName}</strong>
            </li>
            <li>
              <span>Procedimento</span>
              <strong>{book.data.procedureName}</strong>
            </li>
            <li>
              <span>Horário solicitado</span>
              <strong>{formatConfirmationDate(book.data.startsAt)}</strong>
            </li>
          </ul>
          <p className="public-booking-success-note">
            Você pode receber a confirmação pelo WhatsApp. O horário fica reservado enquanto a clínica aceita.
          </p>
        </div>
      </main>
    );
  }

  const data = page.data;
  const noDentists = data.professionals.length === 0;
  const noProcedures = data.procedures.length === 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!professionalId || !procedureId || !startsAt) {
      setFormError('Escolha dentista, procedimento e horário.');
      return;
    }
    book.mutate(
      {
        name,
        phone,
        email: email || undefined,
        professionalId,
        procedureId,
        startsAt,
        notes: notes || undefined,
      },
      {
        onError: (error) => {
          const message =
            error && typeof error === 'object' && 'response' in error
              ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ?? null)
              : null;
          setFormError(message ?? 'Não foi possível concluir o agendamento.');
        },
      },
    );
  };

  return (
    <main className="public-booking">
      <div className="public-booking-shell">
        <header className="public-booking-header">
          <img src={LOGO} alt="Maria Alice Odontologia Especializada" className="public-booking-logo" />
          <div>
            <p className="public-booking-kicker">
              <Share2 size={14} /> Agendamento online
            </p>
            <h1>{data.clinicName}</h1>
            <p>Escolha o horário e envie sua solicitação em poucos passos.</p>
          </div>
        </header>

        {noDentists || noProcedures ? (
          <EmptyState
            title="Agendamento temporariamente indisponível"
            description={
              noDentists
                ? 'A clínica ainda não cadastrou dentistas para atendimento online.'
                : 'A clínica ainda não cadastrou procedimentos para atendimento online.'
            }
          />
        ) : (
          <form className="public-booking-form" onSubmit={onSubmit}>
            <section>
              <h2>Seus dados</h2>
              <label>
                Nome completo
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                WhatsApp
                <input
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  required
                />
              </label>
              <label>
                E-mail <span>(opcional)</span>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </section>

            <section>
              <h2>Consulta</h2>
              <label>
                Dentista
                <select
                  className="input-field"
                  value={professionalId}
                  onChange={(e) => {
                    setProfessionalId(e.target.value);
                    setStartsAt('');
                  }}
                  required
                >
                  <option value="">Selecione</option>
                  {data.professionals.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.specialty ? ` — ${item.specialty}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Procedimento
                <select
                  className="input-field"
                  value={procedureId}
                  onChange={(e) => setProcedureId(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {data.procedures.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {money(item.price)}
                    </option>
                  ))}
                </select>
              </label>
              {selectedProcedure ? (
                <p className="public-booking-procedure-hint">Valor de referência: {money(selectedProcedure.price)}</p>
              ) : null}
            </section>

            <section>
              <h2>
                <CalendarDays size={18} /> Horário
              </h2>
              <label className="public-booking-date-field">
                Data
                <input
                  className="input-field"
                  type="date"
                  min={todayIso()}
                  max={maxDateIso()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setStartsAt('');
                  }}
                  required
                />
              </label>

              {!professionalId ? (
                <p className="public-booking-slots-empty">Selecione um dentista para ver os horários.</p>
              ) : availability.isLoading ? (
                <p className="public-booking-slots-empty">Carregando horários...</p>
              ) : availability.isError ? (
                <p className="public-booking-slots-empty">Não foi possível carregar os horários.</p>
              ) : availability.data?.slots.length ? (
                <div className="public-booking-slots" role="listbox" aria-label="Horários disponíveis">
                  {availability.data.slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`public-booking-slot${startsAt === slot ? ' is-selected' : ''}`}
                      onClick={() => setStartsAt(slot)}
                    >
                      {formatSlotLabel(slot)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="public-booking-slots-empty">Nenhum horário livre neste dia. Tente outra data.</p>
              )}
            </section>

            <section>
              <label>
                Observações <span>(opcional)</span>
                <textarea
                  className="input-field public-booking-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Conte brevemente o motivo da consulta"
                />
              </label>
            </section>

            {formError ? <p className="public-booking-error">{formError}</p> : null}

            <button className="btn btn-primary public-booking-submit" type="submit" disabled={book.isPending}>
              {book.isPending ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
