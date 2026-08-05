-- Fase 2: anamnese e tratamentos
CREATE TABLE IF NOT EXISTS patient_anamneses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    allergies TEXT,
    preexisting_conditions TEXT,
    continuous_medications TEXT,
    is_pregnant BOOLEAN DEFAULT FALSE,
    pregnancy_notes VARCHAR(255),
    is_smoker BOOLEAN DEFAULT FALSE,
    has_bruxism BOOLEAN DEFAULT FALSE,
    habits_notes TEXT,
    clinical_notes TEXT,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS treatment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id),
    performed_at DATE NOT NULL,
    procedure_name VARCHAR(200) NOT NULL,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_records_patient ON treatment_records (patient_id, performed_at DESC);
