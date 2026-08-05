-- Fase 3: odontograma
CREATE TABLE IF NOT EXISTS odontogram_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tooth_number VARCHAR(5) NOT NULL,
    surface VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY',
    procedure_type VARCHAR(100),
    notes TEXT,
    professional_id UUID REFERENCES professionals(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_odontogram_patient_tooth ON odontogram_entries (patient_id, tooth_number);
