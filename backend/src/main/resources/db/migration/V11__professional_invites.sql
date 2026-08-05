ALTER TABLE professionals
    ADD COLUMN email VARCHAR(150),
    ADD COLUMN invite_token_hash VARCHAR(64),
    ADD COLUMN invite_expires_at TIMESTAMPTZ,
    ADD COLUMN invite_accepted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_professionals_clinic_email ON professionals (clinic_id, email);
