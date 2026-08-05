CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_procedures_clinic ON procedures (clinic_id);

ALTER TABLE appointments
    ADD COLUMN procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL;
