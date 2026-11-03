import { useId, useState, type FormEvent } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import {
  FACES,
  PROCEDURES,
  RECORDED_STATUSES,
  STATUS_META,
  defaultStatusFor,
} from '../../features/tooth-procedures/constants';
import type {
  OdontogramAppointment,
  ProcedureType,
  RecordedStatus,
  ToothFace,
} from '../../features/tooth-procedures/types';

export type ProcedureFormValues = {
  procedureType: ProcedureType;
  status: RecordedStatus;
  notes: string;
};

type Props = {
  selectedTeeth: string[];
  faces: ToothFace[];
  appointments: OdontogramAppointment[];
  appointmentId: string | null;
  disabledReason: string | null;
  submitting: boolean;
  onRemoveTooth: (tooth: string) => void;
  onClearTeeth: () => void;
  onToggleFace: (face: ToothFace) => void;
  onAppointmentChange: (appointmentId: string | null) => void;
  onSubmit: (values: ProcedureFormValues) => Promise<boolean>;
};

const MAX_NOTES = 2000;

function appointmentLabel(option: OdontogramAppointment) {
  const date = new Date(option.startsAt);
  const day = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}${option.professionalName ? ` · ${option.professionalName}` : ''}`;
}

export function ProcedureForm({
  selectedTeeth,
  faces,
  appointments,
  appointmentId,
  disabledReason,
  submitting,
  onRemoveTooth,
  onClearTeeth,
  onToggleFace,
  onAppointmentChange,
  onSubmit,
}: Props) {
  const ids = useId();
  const [procedureType, setProcedureType] = useState<ProcedureType | ''>('');
  const [status, setStatus] = useState<RecordedStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ teeth?: string; procedure?: string }>({});
  const disabled = Boolean(disabledReason) || submitting;
  const registrable = appointments.filter((option) => option.canRegister);
  const effectiveStatus = status || (procedureType ? defaultStatusFor(procedureType) : '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (selectedTeeth.length === 0) nextErrors.teeth = 'Selecione pelo menos um dente no odontograma.';
    if (!procedureType) nextErrors.procedure = 'Selecione o procedimento realizado.';
    setErrors(nextErrors);
    if (nextErrors.teeth || nextErrors.procedure || !procedureType || !effectiveStatus) return;

    const saved = await onSubmit({ procedureType, status: effectiveStatus, notes: notes.trim() });
    if (saved) {
      setProcedureType('');
      setStatus('');
      setNotes('');
      setErrors({});
    }
  };

  return (
    <form className="odg-form" onSubmit={handleSubmit} noValidate aria-labelledby={`${ids}-title`}>
      <h2 id={`${ids}-title`}>Registrar procedimento</h2>

      {disabledReason ? <p className="odg-form-notice">{disabledReason}</p> : null}

      <fieldset className="odg-field" disabled={disabled}>
        <div className="odg-field-head">
          <legend>Dentes selecionados</legend>
          {selectedTeeth.length > 0 ? (
            <button type="button" className="odg-link" onClick={onClearTeeth}>
              Limpar
            </button>
          ) : null}
        </div>
        {selectedTeeth.length > 0 ? (
          <ul className="odg-chips" aria-label="Dentes selecionados">
            {selectedTeeth.map((tooth) => (
              <li key={tooth}>
                <span>{tooth}</span>
                <button type="button" aria-label={`Remover dente ${tooth}`} onClick={() => onRemoveTooth(tooth)}>
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="odg-hint">Nenhum dente selecionado. Clique nos dentes do odontograma.</p>
        )}
        {errors.teeth && selectedTeeth.length === 0 ? (
          <p className="odg-error" role="alert">{errors.teeth}</p>
        ) : null}
      </fieldset>

      <div className="odg-field">
        <label htmlFor={`${ids}-procedure`}>
          Procedimento realizado <span aria-hidden="true">*</span>
        </label>
        <select
          id={`${ids}-procedure`}
          value={procedureType}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.procedure && !procedureType)}
          disabled={disabled}
          onChange={(event) => {
            setProcedureType(event.target.value as ProcedureType | '');
            setStatus('');
          }}
        >
          <option value="">Selecione o procedimento</option>
          {PROCEDURES.map((procedure) => (
            <option key={procedure.value} value={procedure.value}>
              {procedure.label}
            </option>
          ))}
        </select>
        {errors.procedure && !procedureType ? (
          <p className="odg-error" role="alert">{errors.procedure}</p>
        ) : null}
      </div>

      <fieldset className="odg-field" disabled={disabled}>
        <legend>Faces do dente</legend>
        <div className="odg-face-toggles">
          {FACES.map((face) => (
            <button
              key={face.value}
              type="button"
              aria-pressed={faces.includes(face.value)}
              className={faces.includes(face.value) ? 'is-active' : ''}
              onClick={() => onToggleFace(face.value)}
            >
              {face.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="odg-field">
        <label htmlFor={`${ids}-status`}>Situação do dente</label>
        <div className="odg-status-select">
          <i
            aria-hidden="true"
            style={{ background: effectiveStatus ? STATUS_META[effectiveStatus].fill : 'transparent' }}
          />
          <select
            id={`${ids}-status`}
            value={effectiveStatus}
            disabled={disabled || !procedureType}
            onChange={(event) => setStatus(event.target.value as RecordedStatus)}
          >
            {!procedureType ? <option value="">Definida pelo procedimento</option> : null}
            {RECORDED_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="odg-field">
        <label htmlFor={`${ids}-appointment`}>Consulta vinculada</label>
        <select
          id={`${ids}-appointment`}
          value={appointmentId ?? ''}
          disabled={disabled}
          onChange={(event) => onAppointmentChange(event.target.value || null)}
        >
          <option value="">Sem vínculo com consulta</option>
          {registrable.map((option) => (
            <option key={option.id} value={option.id}>
              {appointmentLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="odg-field">
        <label htmlFor={`${ids}-notes`}>Observações</label>
        <textarea
          id={`${ids}-notes`}
          rows={4}
          maxLength={MAX_NOTES}
          value={notes}
          disabled={disabled}
          placeholder="Material utilizado, técnica, orientações ao paciente…"
          onChange={(event) => setNotes(event.target.value)}
        />
        <small className="odg-counter">
          {notes.length}/{MAX_NOTES}
        </small>
      </div>

      <button type="submit" className="odg-submit" disabled={disabled}>
        <ClipboardCheck size={18} />
        {submitting ? 'Registrando…' : 'Registrar no prontuário'}
      </button>
    </form>
  );
}
