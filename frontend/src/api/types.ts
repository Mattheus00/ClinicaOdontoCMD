export type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export function asPage<T>(value: unknown): PageResponse<T> {
  if (value && typeof value === 'object' && Array.isArray((value as { content?: unknown }).content)) {
    const page = value as Partial<PageResponse<T>>;
    return { content: page.content ?? [], totalPages: page.totalPages ?? 0, totalElements: page.totalElements ?? 0, number: page.number ?? 0, size: page.size ?? 20 };
  }
  return { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };
}

export type Patient = {
  id: string;
  name: string;
  phone: string;
  phoneIsWhatsapp?: boolean | null;
  email?: string | null;
  cpf?: string | null;
  rg?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianCpf?: string | null;
  referralSource?: string | null;
  referralNotes?: string | null;
  notes?: string | null;
  preferredProfessionalId?: string | null;
  preferredProfessionalName?: string | null;
  preferredTimeNotes?: string | null;
  consentGivenAt?: string | null;
  consentVersion?: string | null;
  createdAt?: string | null;
  lastVisitAt?: string | null;
};

export type PatientInput = {
  name: string;
  phone: string;
  phoneIsWhatsapp?: boolean;
  email?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressDistrict?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianCpf?: string;
  referralSource?: string;
  referralNotes?: string;
  notes?: string;
  preferredProfessionalId?: string | null;
  preferredTimeNotes?: string;
};

export type Anamnesis = {
  allergies?: string | null;
  preexistingConditions?: string | null;
  continuousMedications?: string | null;
  isPregnant?: boolean | null;
  pregnancyNotes?: string | null;
  isSmoker?: boolean | null;
  hasBruxism?: boolean | null;
  habitsNotes?: string | null;
  clinicalNotes?: string | null;
  updatedAt?: string | null;
};

export type TreatmentRecord = {
  id: string;
  procedureName: string;
  notes?: string | null;
  status: string;
  performedAt: string;
  professionalId?: string | null;
  professionalName?: string | null;
};

export type OdontogramEntry = {
  id: string;
  toothNumber: string;
  surface?: string | null;
  status: string;
  procedureType?: string | null;
  notes?: string | null;
  recordedAt: string;
};

export type TreatmentPlanItem = { id?: string; description: string; quantity: number; unitPrice: number };
export type TreatmentPlan = {
  id: string;
  title: string;
  status: string;
  totalAmount: number;
  dueDate?: string | null;
  notes?: string | null;
  items: TreatmentPlanItem[];
  createdAt: string;
};

export type PatientPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt?: string | null;
  planId?: string | null;
  notes?: string | null;
};

export type PatientInsurance = {
  id: string;
  providerName: string;
  planName?: string | null;
  cardNumber?: string | null;
  status: string;
};

export type BillingSummary = {
  approved: number;
  pending: number;
  paid: number;
  overdue: number;
  openBalance: number;
};

export type FinancialTotals = BillingSummary & {
  receivedInPeriod: number;
  patientCount: number;
};

export type ProfessionalFinancialBreakdown = FinancialTotals & {
  professionalId?: string | null;
  professionalName: string;
};

export type FinancialDashboard = {
  period: { from: string; to: string };
  totals: FinancialTotals;
  byProfessional: ProfessionalFinancialBreakdown[];
};

export type PatientSummary = {
  patient: Patient;
  lastVisitAt?: string | null;
  pregnantFlag: boolean;
  hasAllergies: boolean;
  billing: BillingSummary;
};

export type AppointmentHistory = {
  id: string;
  startsAt: string;
  status: string;
  professionalName: string;
};

export type AccessLog = {
  id: string;
  userId: string;
  action: string;
  resource?: string | null;
  createdAt: string;
};

export type Professional = {
  id: string;
  name: string;
  email?: string | null;
  specialty?: string | null;
  accessStatus?: 'PENDING' | 'ACTIVE';
  inviteExpiresAt?: string | null;
  inviteUrl?: string | null;
  appointmentCount?: number;
};
export type Procedure = { id: string; name: string; price: number };
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type Appointment = {
  id: string;
  patient: Patient;
  professional: Professional;
  procedure?: Procedure | null;
  startsAt: string;
  endsAt: string;
  durationMinutes?: number;
  status: AppointmentStatus;
};
export type ConversationStatus = 'BOT_ACTIVE' | 'TRANSFERRED' | 'COMPLETED';
export type Conversation = { id: string; patientName?: string; phone: string; lastMessage: string; updatedAt: string; status: ConversationStatus; unreadCount: number; takenOverByCurrentUser?: boolean };
export type Invoice = { id: string; issuedAt: string; amount: number; status: 'PAID' | 'PENDING' | 'FAILED'; invoiceUrl?: string };
export type Subscription = { planName: string; status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED'; price: number; currency?: string; nextBillingAt?: string | null; trialEndsAt?: string | null; features: string[] };
