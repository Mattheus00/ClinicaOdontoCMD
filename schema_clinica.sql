-- ============================================
-- Schema: Sistema de Gestão de Clínicas Odontológicas
-- Banco: PostgreSQL
-- ============================================

CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'trial', -- trial, basic, pro
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'secretary', -- admin, secretary, dentist
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (clinic_id, email)
);

CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100),
    cro VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time)
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL, -- número do WhatsApp
    email VARCHAR(150),
    birth_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (clinic_id, phone)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes SMALLINT NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no_show
    created_via VARCHAR(20) NOT NULL DEFAULT 'manual', -- whatsapp, manual
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_phone VARCHAR(20) NOT NULL,
    current_step VARCHAR(50) NOT NULL DEFAULT 'inicio',
    context_json JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (clinic_id, patient_phone)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- reminder_24h, confirmation, cancellation
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, sent, failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Índices críticos de performance
-- ============================================

-- Checar disponibilidade de horário rapidamente
CREATE INDEX idx_appointments_prof_time
    ON appointments (professional_id, scheduled_at);

-- Buscar agendamentos de uma clínica por período
CREATE INDEX idx_appointments_clinic_time
    ON appointments (clinic_id, scheduled_at);

-- Buscar paciente pelo telefone (usado toda vez que o bot recebe mensagem)
CREATE INDEX idx_patients_phone
    ON patients (clinic_id, phone);

-- Buscar conversa ativa do bot rapidamente
CREATE INDEX idx_whatsapp_conv_phone
    ON whatsapp_conversations (clinic_id, patient_phone);

-- Notificações pendentes de envio
CREATE INDEX idx_notifications_status
    ON notifications (status, sent_at);
