-- ============================================
-- Migração: V3 - Appointment Constraints
-- ============================================

-- Extensão necessária para usar o índice GiST em colunas exclusivas
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Adiciona a restrição (constraint) no banco que impede agendamentos no mesmo profissional no mesmo período.
-- 'tsrange' cria um período contínuo baseado no início (scheduled_at) e no fim (scheduled_at + duration_minutes).
ALTER TABLE appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
    professional_id WITH =,
    tsrange(
        scheduled_at, 
        scheduled_at + (duration_minutes || ' minutes')::interval
    ) WITH &&
) WHERE (status IN ('pending', 'confirmed'));
