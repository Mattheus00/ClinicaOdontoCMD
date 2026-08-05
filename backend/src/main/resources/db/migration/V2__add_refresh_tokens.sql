-- ============================================
-- Migração: V2 - Refresh Tokens
-- ============================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Buscar rapidamente o token ativo de um usuário
CREATE INDEX idx_refresh_tokens_user 
    ON refresh_tokens (user_id) 
    WHERE revoked = false;
