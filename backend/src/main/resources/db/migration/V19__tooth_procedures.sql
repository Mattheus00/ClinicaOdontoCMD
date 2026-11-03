CREATE TABLE tooth_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    tooth_number VARCHAR(2) NOT NULL,
    procedure_type VARCHAR(30) NOT NULL,
    faces VARCHAR(20),
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancel_reason TEXT,
    CONSTRAINT tooth_procedures_status_check
        CHECK (status IN ('TREATED', 'RESTORATION', 'IN_PROGRESS', 'NEEDS_TREATMENT')),
    CONSTRAINT tooth_procedures_type_check
        CHECK (procedure_type IN (
            'RESTORATION', 'CLEANING', 'EXTRACTION', 'ROOT_CANAL', 'SEALANT', 'FLUORIDE',
            'WHITENING', 'CROWN', 'IMPLANT', 'VENEER', 'SCALING', 'OTHER'
        ))
);

CREATE INDEX idx_tooth_procedures_patient ON tooth_procedures (patient_id, tooth_number, created_at DESC);
CREATE INDEX idx_tooth_procedures_clinic ON tooth_procedures (clinic_id);
CREATE INDEX idx_tooth_procedures_appointment ON tooth_procedures (appointment_id);
CREATE INDEX idx_tooth_procedures_professional ON tooth_procedures (professional_id);

CREATE TABLE tooth_procedure_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    tooth_procedure_id UUID NOT NULL REFERENCES tooth_procedures(id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL,
    user_id UUID,
    before_state TEXT,
    after_state TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tooth_procedure_audit_action_check CHECK (action IN ('CREATE', 'UPDATE', 'CANCEL'))
);

CREATE INDEX idx_tooth_procedure_audit_procedure ON tooth_procedure_audit (tooth_procedure_id, created_at DESC);
CREATE INDEX idx_tooth_procedure_audit_clinic ON tooth_procedure_audit (clinic_id);

ALTER TABLE tooth_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_procedure_audit ENABLE ROW LEVEL SECURITY;
