export type OdontogramStatus =
  | 'HEALTHY'
  | 'CARIES'
  | 'RESTORED'
  | 'MISSING'
  | 'EXTRACTION_INDICATED'
  | 'EXTRACTED'
  | 'IMPLANT'
  | 'ROOT_CANAL'
  | 'CROWN'
  | 'FRACTURE'
  | 'IN_TREATMENT';

export type ToothRecord = {
  numero: string;
  status: OdontogramStatus;
  procedimento: string | null;
  observacao: string;
};

export type OdontogramPayload = {
  pacienteId: string;
  dentes: ToothRecord[];
};

export type OdontogramSaveEntry = {
  toothNumber: string;
  status: string;
  procedureType?: string;
  notes?: string;
  surface?: string;
};

export type ToothSelectEvent = {
  tooth: string;
  surface?: string;
};
