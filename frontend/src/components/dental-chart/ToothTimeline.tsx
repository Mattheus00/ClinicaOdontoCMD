import { useState } from 'react';
import { Ban, History, Pencil } from 'lucide-react';
import { Modal } from '../Modal';
import {
  FACES,
  FACE_LABEL,
  PROCEDURES,
  PROCEDURE_LABEL,
  RECORDED_STATUSES,
  STATUS_META,
  toothName,
} from '../../features/tooth-procedures/constants';
import {
  useCancelToothProcedure,
  useToothProcedureAudit,
  useUpdateToothProcedure,
} from '../../features/tooth-procedures/api';
import type {
  ProcedureType,
  RecordedStatus,
  ToothFace,
  ToothProcedureRecord,
} from '../../features/tooth-procedures/types';

type Props = {
  patientId: string;
  tooth: string | null;
  records: ToothProcedureRecord[];
  loading: boolean;
  readOnly: boolean;
};

const RECENT_LIMIT = 8;

const AUDIT_LABEL = { CREATE: 'Registro criado', UPDATE: 'Registro editado', CANCEL: 'Registro cancelado' } as const;

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function toast(message: string) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message } }));
}

export function ToothTimeline({ patientId, tooth, records, loading, readOnly }: Props) {
  const [editing, setEditing] = useState<ToothProcedureRecord | null>(null);
  const [cancelling, setCancelling] = useState<ToothProcedureRecord | null>(null);
  const [auditFor, setAuditFor] = useState<string | null>(null);

  const visible = tooth
    ? records.filter((record) => record.toothNumber === tooth)
    : records.filter((record) => !record.cancelled).slice(0, RECENT_LIMIT);

  return (
    <section className="odg-timeline" aria-labelledby="odg-timeline-title">
      <header>
        <h2 id="odg-timeline-title">{tooth ? `Histórico do dente ${tooth}` : 'Últimos registros'}</h2>
        {tooth ? <p>{toothName(tooth)}</p> : <p>Selecione um dente para ver o histórico completo.</p>}
      </header>

      {loading ? <p className="odg-hint">Carregando histórico…</p> : null}
      {!loading && visible.length === 0 ? (
        <p className="odg-hint">{tooth ? 'Nenhum procedimento registrado neste dente.' : 'Nenhum procedimento registrado ainda.'}</p>
      ) : null}

      <ol className="odg-timeline-list">
        {visible.map((record) => (
          <li key={record.id} className={record.cancelled ? 'is-cancelled' : ''}>
            <span
              className="odg-timeline-dot"
              style={{ background: STATUS_META[record.status].fill }}
              aria-hidden="true"
            />
            <div className="odg-timeline-body">
              <div className="odg-timeline-top">
                <strong>
                  {!tooth ? <span className="odg-timeline-tooth">{record.toothNumber}</span> : null}
                  {PROCEDURE_LABEL[record.procedureType]}
                </strong>
                <time dateTime={record.createdAt}>{formatDateTime(record.createdAt)}</time>
              </div>
              <div className="odg-timeline-meta">
                <span>{STATUS_META[record.status].label}</span>
                {record.faces.length > 0 ? (
                  <span>Faces: {record.faces.map((face) => FACE_LABEL[face]).join(', ')}</span>
                ) : null}
                {record.professionalName ? <span>{record.professionalName}</span> : null}
                {record.appointmentAt ? <span>Consulta de {new Date(record.appointmentAt).toLocaleDateString('pt-BR')}</span> : null}
              </div>
              {record.notes ? <p className="odg-timeline-notes">{record.notes}</p> : null}
              {record.cancelled ? (
                <p className="odg-timeline-cancel">
                  Cancelado{record.cancelReason ? `: ${record.cancelReason}` : ''}
                </p>
              ) : null}
              {record.updatedAt !== record.createdAt && !record.cancelled ? (
                <p className="odg-timeline-edited">Editado em {formatDateTime(record.updatedAt)}</p>
              ) : null}
              <div className="odg-timeline-actions">
                {!readOnly && record.canEdit && !record.cancelled ? (
                  <>
                    <button type="button" onClick={() => setEditing(record)}>
                      <Pencil size={13} /> Editar
                    </button>
                    <button type="button" className="is-danger" onClick={() => setCancelling(record)}>
                      <Ban size={13} /> Cancelar
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  aria-expanded={auditFor === record.id}
                  onClick={() => setAuditFor((current) => (current === record.id ? null : record.id))}
                >
                  <History size={13} /> Auditoria
                </button>
              </div>
              {auditFor === record.id ? <AuditTrail procedureId={record.id} /> : null}
            </div>
          </li>
        ))}
      </ol>

      {editing ? <EditRecordModal patientId={patientId} record={editing} onClose={() => setEditing(null)} /> : null}
      {cancelling ? (
        <CancelRecordModal patientId={patientId} record={cancelling} onClose={() => setCancelling(null)} />
      ) : null}
    </section>
  );
}

function AuditTrail({ procedureId }: { procedureId: string }) {
  const audit = useToothProcedureAudit(procedureId);
  if (audit.isLoading) return <p className="odg-hint">Carregando auditoria…</p>;
  if (!audit.data?.length) return <p className="odg-hint">Sem eventos de auditoria.</p>;
  return (
    <ul className="odg-audit">
      {audit.data.map((entry) => (
        <li key={entry.id}>
          <strong>{AUDIT_LABEL[entry.action]}</strong> em {formatDateTime(entry.createdAt)}
          {entry.reason ? <span> · Motivo: {entry.reason}</span> : null}
          {entry.action === 'UPDATE' && entry.before ? <small>Antes: {entry.before}</small> : null}
        </li>
      ))}
    </ul>
  );
}

function EditRecordModal({ patientId, record, onClose }: { patientId: string; record: ToothProcedureRecord; onClose: () => void }) {
  const update = useUpdateToothProcedure(patientId);
  const [procedureType, setProcedureType] = useState<ProcedureType>(record.procedureType);
  const [status, setStatus] = useState<RecordedStatus>(record.status);
  const [faces, setFaces] = useState<ToothFace[]>(record.faces);
  const [notes, setNotes] = useState(record.notes ?? '');
  const [reason, setReason] = useState('');

  const save = () => {
    update.mutate(
      { id: record.id, input: { procedureType, status, faces, notes, reason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          toast(`Registro do dente ${record.toothNumber} atualizado.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal title={`Editar registro — dente ${record.toothNumber}`} onClose={onClose}>
      <div className="odg-modal-form">
        <label>
          Procedimento
          <select value={procedureType} onChange={(event) => setProcedureType(event.target.value as ProcedureType)}>
            {PROCEDURES.map((procedure) => (
              <option key={procedure.value} value={procedure.value}>
                {procedure.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Situação do dente
          <select value={status} onChange={(event) => setStatus(event.target.value as RecordedStatus)}>
            {RECORDED_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Faces</legend>
          <div className="odg-face-toggles">
            {FACES.map((face) => (
              <button
                key={face.value}
                type="button"
                aria-pressed={faces.includes(face.value)}
                className={faces.includes(face.value) ? 'is-active' : ''}
                onClick={() =>
                  setFaces((current) =>
                    current.includes(face.value) ? current.filter((value) => value !== face.value) : [...current, face.value],
                  )
                }
              >
                {face.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Observações
          <textarea rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <label>
          Motivo da alteração
          <input value={reason} maxLength={300} placeholder="Ex.: correção da face registrada" onChange={(event) => setReason(event.target.value)} />
        </label>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Voltar
        </button>
        <button type="button" className="btn btn-primary" disabled={update.isPending} onClick={save}>
          {update.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </Modal>
  );
}

function CancelRecordModal({ patientId, record, onClose }: { patientId: string; record: ToothProcedureRecord; onClose: () => void }) {
  const cancel = useCancelToothProcedure(patientId);
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 3;

  const confirm = () => {
    cancel.mutate(
      { id: record.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast(`Registro do dente ${record.toothNumber} cancelado.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal title={`Cancelar registro — dente ${record.toothNumber}`} onClose={onClose}>
      <p className="odg-modal-text">
        O registro de <strong>{PROCEDURE_LABEL[record.procedureType]}</strong> de {formatDateTime(record.createdAt)} deixará
        de contar na situação do dente, mas continuará visível no histórico e na auditoria.
      </p>
      <div className="odg-modal-form">
        <label>
          Motivo do cancelamento *
          <input
            value={reason}
            maxLength={300}
            placeholder="Ex.: registrado no dente errado"
            aria-required="true"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Voltar
        </button>
        <button type="button" className="btn btn-danger" disabled={!valid || cancel.isPending} onClick={confirm}>
          {cancel.isPending ? 'Cancelando…' : 'Cancelar registro'}
        </button>
      </div>
    </Modal>
  );
}
