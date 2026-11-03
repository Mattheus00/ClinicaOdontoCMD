-- V16 criou staff_notifications sem o lockdown de Data API usado nas demais tabelas clínicas.
REVOKE ALL ON TABLE staff_notifications FROM anon, authenticated;
ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;

-- Histórico do Flyway não precisa da Data API; reforça o isolamento.
REVOKE ALL ON TABLE flyway_schema_history FROM anon, authenticated;

-- Índices de FK apontados pelos advisors de performance.
CREATE INDEX IF NOT EXISTS idx_staff_notifications_appointment
    ON staff_notifications (appointment_id);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_recipient_professional
    ON staff_notifications (recipient_professional_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_clinic
    ON stock_movements (clinic_id);
