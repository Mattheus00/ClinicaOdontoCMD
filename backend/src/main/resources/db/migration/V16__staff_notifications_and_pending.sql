-- Staff inbox for public booking requests + PENDING holds the slot.

CREATE TABLE IF NOT EXISTS staff_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_clinic_created
    ON staff_notifications (clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_clinic_unread
    ON staff_notifications (clinic_id)
    WHERE read_at IS NULL;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
    professional_id WITH =,
    tsrange(
        scheduled_at AT TIME ZONE 'UTC',
        (scheduled_at AT TIME ZONE 'UTC') + make_interval(mins => duration_minutes)
    ) WITH &&
) WHERE (status IN ('PENDING', 'SCHEDULED', 'CONFIRMED', 'pending', 'confirmed'));
