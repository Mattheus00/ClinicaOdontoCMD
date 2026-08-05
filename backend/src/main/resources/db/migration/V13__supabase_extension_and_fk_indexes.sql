-- Mantém extensões fora do schema exposto pela Data API.
DO $$
BEGIN
    IF (SELECT n.nspname
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'btree_gist') = 'public' THEN
        ALTER EXTENSION btree_gist SET SCHEMA extensions;
    END IF;
END
$$;

-- Índices de FKs usados em junções, deleções em cascata e filtros por relacionamento.
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_procedure ON appointments (procedure_id);
CREATE INDEX IF NOT EXISTS idx_clinics_plan ON clinics (plan_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications (appointment_id);
CREATE INDEX IF NOT EXISTS idx_odontogram_entries_professional ON odontogram_entries (professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurances_patient ON patient_insurances (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_patient ON patient_payments (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_plan ON patient_payments (plan_id);
CREATE INDEX IF NOT EXISTS idx_patients_preferred_professional ON patients (preferred_professional_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user ON professionals (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic ON subscriptions (clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_plan ON treatment_plan_items (plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans (patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_professional ON treatment_records (professional_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_professional ON working_hours (professional_id);
