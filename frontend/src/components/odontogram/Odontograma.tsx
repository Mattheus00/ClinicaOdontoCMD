import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { LoadingState } from '../AsyncState';
import { useOdontogram, useSaveOdontogram } from '../../features/patients/api';
import { ALL_FDI_TEETH } from '../../features/odontogram/odontogram.constants';
import type { OdontogramStatus } from '../../features/odontogram/odontogram.types';
import { useOdontogramEditor } from '../../features/odontogram/useOdontogramEditor';
import OdontogramaSvg from './pro/Odontograma';
import { useOdontogramHover } from './pro/hooks';
import type { OdontogramClickPayload } from './pro/types';
import LegendaStatus from './LegendaStatus';
import MarcacaoToolbar, { type MarkMode } from './MarcacaoToolbar';
import PainelDente from './PainelDente';
import ListaDentesSelecionados from './ListaDentesSelecionados';
import './Odontograma.css';

type Props = {
  patientId: string;
};

export default function Odontograma({ patientId }: Props) {
  const odontogram = useOdontogram(patientId);
  const saveOdontogram = useSaveOdontogram(patientId);
  const editor = useOdontogramEditor(odontogram.data);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [markMode, setMarkMode] = useState<MarkMode>('paint');
  const [brushStatus, setBrushStatus] = useState<OdontogramStatus>('CARIES');
  const [brushProcedure, setBrushProcedure] = useState<string | null>(null);
  const [lastSurface, setLastSurface] = useState<string | null>(null);

  const applyMark = useCallback(
    (payload: OdontogramClickPayload) => {
      const fdi = String(payload.tooth);
      setLastSurface(payload.surface);
      editor.updateTooth(fdi, {
        status: brushStatus,
        procedimento: brushProcedure,
      });
      editor.handleSelect({ tooth: fdi, surface: payload.surface });
    },
    [brushStatus, brushProcedure, editor],
  );

  const { hovered, handleSurfaceHover } = useOdontogramHover();

  const applyPanelMark = useCallback(() => {
    if (!editor.activeRecord) return;
    const patch = {
      status: editor.activeRecord.status,
      procedimento: editor.activeRecord.procedimento,
      observacao: editor.activeRecord.observacao,
    };
    if (editor.selected.size > 1) editor.updateSelected(patch);
    else if (editor.activeTooth) editor.updateTooth(editor.activeTooth, patch);
  }, [editor]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        editor.focusTooth(editor.focusIndex + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        editor.focusTooth(editor.focusIndex - 1);
      } else if (event.key === 'Escape') {
        editor.clearSelection();
      }
    },
    [editor],
  );

  const handleSave = async () => {
    setFeedback(null);
    try {
      const result = await saveOdontogram.mutateAsync(editor.getSavePayload());
      editor.applySaved(result);
      setFeedback({ type: 'success', message: 'Odontograma salvo com sucesso.' });
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível salvar o odontograma. Tente novamente.' });
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  if (odontogram.isLoading) return <LoadingState />;

  return (
    <div className="odontograma" onKeyDown={handleKeyDown}>
      <MarcacaoToolbar
        mode={markMode}
        onModeChange={setMarkMode}
        brushStatus={brushStatus}
        brushProcedure={brushProcedure}
        onBrushStatusChange={(status) => {
          setBrushStatus(status);
          setMarkMode('paint');
        }}
        onBrushProcedureChange={setBrushProcedure}
      />

      <LegendaStatus
        activeStatus={markMode === 'paint' ? brushStatus : null}
        onPickStatus={(status) => {
          setBrushStatus(status);
          setMarkMode('paint');
        }}
      />

      <div className="odontograma-workspace">
        <div
          className={`odontograma-viewport ${markMode === 'paint' ? 'is-paint-mode' : ''}`}
          tabIndex={0}
          aria-label="Odontograma clínico vetorial. Clique nas superfícies dos dentes para marcar."
        >
          <OdontogramaSvg
            statuses={editor.statusMap}
            selectedTeeth={editor.selected}
            focusedTooth={editor.activeTooth}
            hovered={hovered}
            onSurfaceClick={applyMark}
            onSurfaceHover={handleSurfaceHover}
          />
          {markMode === 'paint' && <div className="odo-paint-badge">Modo marcação ativo</div>}
          {lastSurface && editor.activeTooth && (
            <div className="odo-surface-badge">Superfície: {lastSurface}</div>
          )}
        </div>

        <PainelDente
          record={editor.activeRecord}
          selectionCount={editor.selected.size}
          onChange={(patch) => {
            if (patch.status) setBrushStatus(patch.status);
            if (patch.procedimento !== undefined) setBrushProcedure(patch.procedimento);
            if (editor.activeTooth) editor.updateTooth(editor.activeTooth, patch);
          }}
          onApplyToSelection={(patch) => {
            if (patch.status) setBrushStatus(patch.status);
            if (patch.procedimento !== undefined) setBrushProcedure(patch.procedimento);
            editor.updateSelected(patch);
          }}
          onMark={applyPanelMark}
          onMarkSelection={applyPanelMark}
          onRemove={() =>
            editor.removeMarking(editor.selected.size ? undefined : editor.activeTooth ? [editor.activeTooth] : [])
          }
        />
      </div>

      <ListaDentesSelecionados
        selected={editor.selectedList}
        marked={editor.markedList}
        activeTooth={editor.activeTooth}
        onSelectTooth={(numero) => {
          editor.handleSelect({ tooth: numero });
          editor.focusTooth(ALL_FDI_TEETH.indexOf(numero as (typeof ALL_FDI_TEETH)[number]));
        }}
      />

      <div className="odontograma-toolbar">
        <button type="button" className="btn btn-secondary" onClick={editor.clearSelection} disabled={!editor.selected.size}>
          Limpar seleção
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={editor.resetToSaved}
          disabled={!editor.isDirty}
        >
          Restaurar estado inicial
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saveOdontogram.isPending || !editor.isDirty}
        >
          {saveOdontogram.isPending ? 'Salvando...' : 'Salvar odontograma'}
        </button>
      </div>

      {feedback && (
        <div
          className={`odontograma-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
