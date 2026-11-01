CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    minimum_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT stock_items_category_check CHECK (category IN ('DENTAL', 'CLINIC')),
    CONSTRAINT stock_items_quantity_check CHECK (quantity >= 0),
    CONSTRAINT stock_items_minimum_check CHECK (minimum_quantity >= 0)
);

CREATE INDEX idx_stock_items_clinic ON stock_items (clinic_id);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(10) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT stock_movements_type_check CHECK (movement_type IN ('IN', 'OUT', 'ADJUST')),
    CONSTRAINT stock_movements_quantity_check CHECK (quantity > 0)
);

CREATE INDEX idx_stock_movements_item ON stock_movements (item_id, created_at DESC);

ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
