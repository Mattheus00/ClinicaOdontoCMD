-- Notifications can target a specific dentist (null = clinic staff inbox).
ALTER TABLE staff_notifications
    ADD COLUMN IF NOT EXISTS recipient_professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_staff_notifications_recipient_created
    ON staff_notifications (clinic_id, recipient_professional_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_recipient_unread
    ON staff_notifications (clinic_id, recipient_professional_id)
    WHERE read_at IS NULL;
