-- Velora SaaS plans catalog + subscription plan link for Abacate Pay

ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS slug VARCHAR(50),
    ADD COLUMN IF NOT EXISTS description VARCHAR(255),
    ADD COLUMN IF NOT EXISTS list_price_cents INTEGER,
    ADD COLUMN IF NOT EXISTS max_team_users INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS gateway_product_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS features_json TEXT,
    ADD COLUMN IF NOT EXISTS highlighted BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS checkout_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE plans SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

ALTER TABLE plans
    ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_plans_slug ON plans (slug);

ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS gateway_customer_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS gateway_checkout_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_subscription_id
    ON subscriptions (gateway_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_id
    ON subscriptions (clinic_id);

INSERT INTO plans (
    id, name, slug, description, price_cents, list_price_cents,
    max_professionals, max_team_users, includes_whatsapp,
    features_json, highlighted, checkout_enabled, active, sort_order
) VALUES
(
    'a1111111-1111-1111-1111-111111111001',
    'Solo',
    'solo',
    'Consultórios individuais',
    6900,
    8900,
    1,
    2,
    false,
    '["Agenda de consultas","Agendamento online","Gestão de pacientes","Prontuário odontológico","Odontograma","Cadastro de procedimentos","Controle financeiro básico"]',
    false,
    true,
    true,
    1
),
(
    'a1111111-1111-1111-1111-111111111002',
    'Clínica',
    'clinica',
    'Clínicas em crescimento',
    12900,
    16900,
    5,
    10,
    false,
    '["Tudo do Solo","Financeiro por dentista","Gestão de estoque","Relatórios financeiros completos","Gestão de permissões","Até 5 dentistas"]',
    true,
    true,
    true,
    2
),
(
    'a1111111-1111-1111-1111-111111111003',
    'Performance',
    'performance',
    'Operações avançadas',
    27900,
    27900,
    15,
    30,
    true,
    '["Tudo do Clínica","Lembretes automáticos","Integração WhatsApp","Múltiplas unidades","Dashboard avançado","Até 15 dentistas"]',
    false,
    false,
    true,
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    list_price_cents = EXCLUDED.list_price_cents,
    max_professionals = EXCLUDED.max_professionals,
    max_team_users = EXCLUDED.max_team_users,
    includes_whatsapp = EXCLUDED.includes_whatsapp,
    features_json = EXCLUDED.features_json,
    highlighted = EXCLUDED.highlighted,
    checkout_enabled = EXCLUDED.checkout_enabled,
    active = EXCLUDED.active,
    sort_order = EXCLUDED.sort_order;
