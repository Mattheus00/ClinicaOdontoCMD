-- ============================================
-- Migração: V3 - Appointment Constraints
-- ============================================

-- Extensão necessária para usar o índice GiST em colunas exclusivas
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- Adiciona a restrição (constraint) no banco que impede agendamentos no mesmo profissional no mesmo período.
-- Normalizar para UTC deixa a expressão do índice imutável e mantém o intervalo absoluto do atendimento.
ALTER TABLE appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
    professional_id WITH =,
    tsrange(
        scheduled_at AT TIME ZONE 'UTC',
        (scheduled_at AT TIME ZONE 'UTC') + make_interval(mins => duration_minutes)
    ) WITH &&
) WHERE (status IN ('pending', 'confirmed'));
