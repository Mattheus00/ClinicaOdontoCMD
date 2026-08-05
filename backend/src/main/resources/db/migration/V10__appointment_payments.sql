ALTER TABLE patient_payments
    ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_patient_payments_appointment ON patient_payments (appointment_id);
