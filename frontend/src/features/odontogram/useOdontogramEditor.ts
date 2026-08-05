import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OdontogramEntry } from '../../api/types';
import { ALL_FDI_TEETH } from './odontogram.constants';
import type { OdontogramSaveEntry, OdontogramStatus, ToothRecord, ToothSelectEvent } from './odontogram.types';

function defaultTooth(numero: string): ToothRecord {
  return { numero, status: 'HEALTHY', procedimento: null, observacao: '' };
}

function fromApi(entries: OdontogramEntry[] | undefined): Record<string, ToothRecord> {
  const map: Record<string, ToothRecord> = {};
  ALL_FDI_TEETH.forEach((n) => {
    map[n] = defaultTooth(n);
  });
  entries?.forEach((e) => {
    map[e.toothNumber] = {
      numero: e.toothNumber,
      status: (e.status as OdontogramStatus) || 'HEALTHY',
      procedimento: e.procedureType ?? null,
      observacao: e.notes ?? '',
    };
  });
  return map;
}

function cloneTeeth(teeth: Record<string, ToothRecord>): Record<string, ToothRecord> {
  return Object.fromEntries(Object.entries(teeth).map(([k, v]) => [k, { ...v }]));
}

function teethToSavePayload(teeth: Record<string, ToothRecord>): OdontogramSaveEntry[] {
  return Object.values(teeth)
    .filter((t) => t.status !== 'HEALTHY' || t.procedimento || t.observacao.trim())
    .map((t) => ({
      toothNumber: t.numero,
      status: t.status,
      procedureType: t.procedimento || undefined,
      notes: t.observacao.trim() || undefined,
    }));
}

function isMarked(t: ToothRecord): boolean {
  return t.status !== 'HEALTHY' || Boolean(t.procedimento) || Boolean(t.observacao.trim());
}

export function useOdontogramEditor(apiEntries: OdontogramEntry[] | undefined) {
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, ToothRecord>>(() => fromApi(apiEntries));
  const [teeth, setTeeth] = useState<Record<string, ToothRecord>>(() => fromApi(apiEntries));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const entriesKey = useMemo(() => JSON.stringify(apiEntries ?? []), [apiEntries]);

  useEffect(() => {
    const next = fromApi(apiEntries);
    setSavedSnapshot(next);
    setTeeth(cloneTeeth(next));
    setSelected(new Set());
    setActiveTooth(null);
  }, [entriesKey, apiEntries]);

  const statusMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(teeth).forEach((t) => map.set(t.numero, t.status));
    return map;
  }, [teeth]);

  const selectedList = useMemo(
    () => Array.from(selected).map((n) => teeth[n]).filter(Boolean),
    [selected, teeth],
  );

  const markedList = useMemo(() => Object.values(teeth).filter(isMarked), [teeth]);

  const isDirty = useMemo(
    () => JSON.stringify(teethToSavePayload(teeth)) !== JSON.stringify(teethToSavePayload(savedSnapshot)),
    [teeth, savedSnapshot],
  );

  const handleSelect = useCallback((event: ToothSelectEvent) => {
    const { tooth } = event;
    setActiveTooth(tooth);
    setFocusIndex(ALL_FDI_TEETH.indexOf(tooth as (typeof ALL_FDI_TEETH)[number]));
    setSelected(new Set([tooth]));
  }, []);

  const updateTooth = useCallback((numero: string, patch: Partial<ToothRecord>) => {
    setTeeth((prev) => ({
      ...prev,
      [numero]: { ...prev[numero], ...patch, numero },
    }));
  }, []);

  const updateSelected = useCallback((patch: Partial<ToothRecord>) => {
    setTeeth((prev) => {
      const next = { ...prev };
      selected.forEach((n) => {
        next[n] = { ...next[n], ...patch, numero: n };
      });
      return next;
    });
  }, [selected]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setActiveTooth(null);
  }, []);

  const removeMarking = useCallback((numeros?: string[]) => {
    const targets = numeros ?? Array.from(selected);
    if (!targets.length) return;
    setTeeth((prev) => {
      const next = { ...prev };
      targets.forEach((n) => {
        next[n] = defaultTooth(n);
      });
      return next;
    });
    setSelected(new Set());
    setActiveTooth(null);
  }, [selected]);

  const resetToSaved = useCallback(() => {
    setTeeth(cloneTeeth(savedSnapshot));
    setSelected(new Set());
    setActiveTooth(null);
  }, [savedSnapshot]);

  const applySaved = useCallback((entries: OdontogramEntry[]) => {
    const next = fromApi(entries);
    setSavedSnapshot(next);
    setTeeth(cloneTeeth(next));
    setSelected(new Set());
    setActiveTooth(null);
  }, []);

  const focusTooth = useCallback((index: number) => {
    const clamped = ((index % ALL_FDI_TEETH.length) + ALL_FDI_TEETH.length) % ALL_FDI_TEETH.length;
    const tooth = ALL_FDI_TEETH[clamped];
    setFocusIndex(clamped);
    setActiveTooth(tooth);
    setSelected(new Set([tooth]));
  }, []);

  const getSavePayload = useCallback((): OdontogramSaveEntry[] => teethToSavePayload(teeth), [teeth]);

  return {
    teeth,
    statusMap,
    selected,
    selectedList,
    markedList,
    activeTooth,
    activeRecord: activeTooth ? teeth[activeTooth] : null,
    focusIndex,
    isDirty,
    handleSelect,
    updateTooth,
    updateSelected,
    clearSelection,
    removeMarking,
    resetToSaved,
    applySaved,
    focusTooth,
    getSavePayload,
  };
}
