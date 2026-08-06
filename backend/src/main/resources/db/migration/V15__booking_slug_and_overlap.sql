-- Public Instagram booking link + overlap constraint aligned with app statuses.

ALTER TABLE clinics
    ADD COLUMN IF NOT EXISTS booking_slug VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_booking_slug
    ON clinics (booking_slug)
    WHERE booking_slug IS NOT NULL;

-- App statuses are SCHEDULED/CONFIRMED (not pending/confirmed).
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
    professional_id WITH =,
    tsrange(
        scheduled_at AT TIME ZONE 'UTC',
        (scheduled_at AT TIME ZONE 'UTC') + make_interval(mins => duration_minutes)
    ) WITH &&
) WHERE (status IN ('SCHEDULED', 'CONFIRMED', 'pending', 'confirmed'));
