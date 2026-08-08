-- Clinical visit report filled by the attending dentist for patient history.
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS report TEXT;
