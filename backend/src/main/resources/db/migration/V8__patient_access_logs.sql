-- Fase 5: auditoria LGPD
CREATE TABLE IF NOT EXISTS patient_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(30) NOT NULL,
    resource VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_access_logs_patient ON patient_access_logs (patient_id, created_at DESC);
