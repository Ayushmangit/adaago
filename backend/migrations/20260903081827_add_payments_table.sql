-- +goose Up
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,

    fee_due_id BIGINT NOT NULL
        REFERENCES fee_dues(id)
        ON DELETE RESTRICT,

    amount_paise BIGINT NOT NULL
        CHECK (amount_paise > 0),

    payment_method VARCHAR(20) NOT NULL
        CHECK (
            payment_method IN (
                'cash',
                'upi',
                'card',
                'bank_transfer'
            )
        ),

    reference_number VARCHAR(100),
    notes TEXT,

    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    received_by BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_fee_due_id
    ON payments(fee_due_id);

CREATE INDEX IF NOT EXISTS idx_payments_paid_at
    ON payments(paid_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_number
    ON payments(reference_number)
    WHERE reference_number IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS payments;
