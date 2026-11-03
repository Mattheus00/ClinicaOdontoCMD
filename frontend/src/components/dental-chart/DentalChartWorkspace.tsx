import { useCallback, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useOdontogramAppointments,
  useOdontogramState,
  useRegisterToothProcedures,
  useToothProcedures,
} from '../../features/tooth-procedures/api';
import { isDeciduous } from '../../features/tooth-procedures/constants';
import { pickRegisterAppointment, sortTeeth, stateByTooth, toggleTooth } from '../../features/tooth-procedures/state';
import type { Dentition, ToothFace } from '../../features/tooth-procedures/types';
import { ErrorState, LoadingState } from '../AsyncState';
import { OdontogramViewer } from './OdontogramViewer';
import { ProcedureForm, type ProcedureFormValues } from './ProcedureForm';
import { ToothTimeline } from './ToothTimeline';
import './DentalChart.css';

type Props = {
  patientId: string;
  /** Appointment from the agenda link; preselected for new records. */
  initialAppointmentId?: string | null;
};

function formatVisit(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function DentalChartWorkspace({ patientId, initialAppointmentId = null }: Props) {
  const { role } = useAuth();
  const [viewAppointmentId, setViewAppointmentId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const [faces, setFaces] = useState<ToothFace[]>([]);
  const [dentition, setDentition] = useState<Dentition>('permanent');
  const [registerAppointmentId, setRegisterAppointmentId] = useState<string | null>(null);
  const [appointmentTouched, setAppointmentTouched] = useState(false);

  const odontogram = useOdontogramState(patientId, viewAppointmentId);
  const appointments = useOdontogramAppointments(patientId);
  const procedures = useToothProcedures(patientId);
  const register = useRegisterToothProcedures(patientId);

  const readOnly = viewAppointmentId !== null;
  const canWrite = role === 'ADMIN' || role === 'DENTIST';
  const states = useMemo(() => stateByTooth(odontogram.data?.teeth), [odontogram.data]);

  const suggestedAppointment = useMemo(
    () => pickRegisterAppointment(appointments.data, initialAppointmentId),
    [appointments.data, initialAppointmentId],
  );
  const effectiveRegisterAppointment = appointmentTouched ? registerAppointmentId : suggestedAppointment;

  const historyRecords = useMemo(() => {
    const all = procedures.data ?? [];
    if (!readOnly || !odontogram.data?.asOf) return all;
    const asOf = odontogram.data.asOf;
    const visible = new Set(odontogram.data.teeth.map((tooth) => tooth.procedureId));
    const cutoff = new Date(asOf.startsAt);
    cutoff.setHours(23, 59, 59, 999);
    return all.filter((record) =>
      visible.has(record.id)
      || (record.appointmentAt
        ? new Date(record.appointmentAt) <= new Date(asOf.startsAt)
        : new Date(record.createdAt) <= cutoff),
    );
  }, [procedures.data, readOnly, odontogram.data]);

  const toggle = useCallback(
    (tooth: string) => {
      const next = toggleTooth(selected, tooth);
      setSelected(next);
      setActiveTooth(next.includes(tooth) ? tooth : next[next.length - 1] ?? null);
    },
    [selected],
  );

  const removeTooth = (tooth: string) => {
    const next = selected.filter((value) => value !== tooth);
    setSelected(next);
    if (activeTooth === tooth) setActiveTooth(next[next.length - 1] ?? null);
  };

  const clearSelection = useCallback(() => {
    setSelected([]);
    setActiveTooth(null);
    setFaces([]);
  }, []);

  const toggleFace = useCallback((face: ToothFace) => {
    setFaces((current) => (current.includes(face) ? current.filter((value) => value !== face) : [...current, face]));
  }, []);

  const changeDentition = (next: Dentition) => {
    setDentition(next);
    setSelected((current) => current.filter((tooth) => isDeciduous(tooth) === (next === 'deciduous')));
    setActiveTooth((active) => (active && isDeciduous(active) === (next === 'deciduous') ? active : null));
  };

  const submit = async (values: ProcedureFormValues) => {
    const teeth = sortTeeth(selected);
    try {
      await register.mutateAsync({
        teeth,
        procedureType: values.procedureType,
        status: values.status,
        faces,
        notes: values.notes || undefined,
        appointmentId: effectiveRegisterAppointment,
      });
    } catch {
      return false;
    }
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          message:
            teeth.length === 1
              ? `Procedimento registrado no dente ${teeth[0]}.`
              : `Procedimento registrado em ${teeth.length} dentes (${teeth.join(', ')}).`,
        },
      }),
    );
    const lastTooth = teeth[teeth.length - 1];
    setSelected([]);
    setFaces([]);
    setActiveTooth(lastTooth);
    return true;
  };

  if (odontogram.isLoading && !odontogram.data) return <LoadingState label="Carregando odontograma…" />;
  if (odontogram.isError && !odontogram.data) {
    return <ErrorState message="Não foi possível carregar o odontograma." onRetry={() => odontogram.refetch()} />;
  }

  const disabledReason = readOnly
    ? 'Visualização histórica: volte para a situação atual para registrar procedimentos.'
    : !canWrite
      ? 'Somente dentistas e administradores podem registrar procedimentos.'
      : null;

  return (
    <div className="odg-workspace">
      <div className="odg-asof">
        <label htmlFor="odg-asof-select">
          <History size={16} aria-hidden="true" /> Visualizar odontograma em
        </label>
        <select
          id="odg-asof-select"
          value={viewAppointmentId ?? ''}
          onChange={(event) => {
            setViewAppointmentId(event.target.value || null);
            clearSelection();
          }}
        >
          <option value="">Situação atual</option>
          {(appointments.data ?? []).map((option) => (
            <option key={option.id} value={option.id}>
              Consulta de {formatVisit(option.startsAt)}
              {option.professionalName ? ` · ${option.professionalName}` : ''}
            </option>
          ))}
        </select>
        {readOnly ? (
          <button type="button" className="odg-link" onClick={() => setViewAppointmentId(null)}>
            Voltar para a situação atual
          </button>
        ) : null}
      </div>

      {readOnly && odontogram.data?.asOf ? (
        <p className="odg-readonly-banner" role="status">
          Exibindo o odontograma como estava na consulta de {formatVisit(odontogram.data.asOf.startsAt)} (somente leitura).
        </p>
      ) : null}

      <div className="odg-grid">
        <OdontogramViewer
          states={states}
          selected={selected}
          activeTooth={activeTooth}
          selectedFaces={faces}
          dentition={dentition}
          readOnly={readOnly}
          onToggleTooth={toggle}
          onActivateTooth={setActiveTooth}
          onToggleFace={toggleFace}
          onDentitionChange={changeDentition}
        />
        <aside className="odg-side">
          <ProcedureForm
            selectedTeeth={selected}
            faces={faces}
            appointments={appointments.data ?? []}
            appointmentId={effectiveRegisterAppointment}
            disabledReason={disabledReason}
            submitting={register.isPending}
            onRemoveTooth={removeTooth}
            onClearTeeth={clearSelection}
            onToggleFace={toggleFace}
            onAppointmentChange={(value) => {
              setAppointmentTouched(true);
              setRegisterAppointmentId(value);
            }}
            onSubmit={submit}
          />
          <ToothTimeline
            patientId={patientId}
            tooth={activeTooth}
            records={historyRecords}
            loading={procedures.isLoading}
            readOnly={readOnly}
          />
        </aside>
      </div>
    </div>
  );
}
