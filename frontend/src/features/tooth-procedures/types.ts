export type ProcedureType =
  | 'RESTORATION'
  | 'CLEANING'
  | 'EXTRACTION'
  | 'ROOT_CANAL'
  | 'SEALANT'
  | 'FLUORIDE'
  | 'WHITENING'
  | 'CROWN'
  | 'IMPLANT'
  | 'VENEER'
  | 'SCALING'
  | 'OTHER';

export type RecordedStatus = 'TREATED' | 'RESTORATION' | 'IN_PROGRESS' | 'NEEDS_TREATMENT';

/** HEALTHY is never stored: it is what a tooth without records shows. */
export type ToothStatus = 'HEALTHY' | RecordedStatus;

export type ToothFace = 'O' | 'V' | 'L' | 'M' | 'D';

export type Dentition = 'permanent' | 'deciduous';

export type ToothState = {
  toothNumber: string;
  status: RecordedStatus;
  procedureType: ProcedureType;
  faces: ToothFace[];
  procedureId: string;
  recordedAt: string;
  professionalName: string | null;
};

export type OdontogramAppointment = {
  id: string;
  startsAt: string;
  status: string | null;
  professionalId: string | null;
  professionalName: string | null;
  canRegister: boolean;
};

export type Odontogram = {
  patient: { id: string; name: string; birthDate: string | null };
  asOf: OdontogramAppointment | null;
  teeth: ToothState[];
};

export type ToothProcedureRecord = {
  id: string;
  toothNumber: string;
  procedureType: ProcedureType;
  faces: ToothFace[];
  status: RecordedStatus;
  notes: string | null;
  appointmentId: string | null;
  appointmentAt: string | null;
  professionalId: string | null;
  professionalName: string | null;
  createdAt: string;
  updatedAt: string;
  cancelled: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  canEdit: boolean;
};

export type RegisterToothProceduresInput = {
  teeth: string[];
  procedureType: ProcedureType;
  faces: ToothFace[];
  status?: RecordedStatus;
  notes?: string;
  appointmentId?: string | null;
};

export type RegisterToothProceduresResult = {
  created: ToothProcedureRecord[];
  odontogram: Odontogram;
};

export type UpdateToothProcedureInput = {
  procedureType?: ProcedureType;
  faces?: ToothFace[];
  status?: RecordedStatus;
  notes?: string;
  reason?: string;
};

export type ToothProcedureAuditEntry = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'CANCEL';
  userId: string | null;
  before: string | null;
  after: string | null;
  reason: string | null;
  createdAt: string;
};
