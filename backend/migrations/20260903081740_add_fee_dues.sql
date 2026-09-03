-- +goose Up
CREATE TABLE IF NOT EXISTS fee_dues (
    id BIGSERIAL PRIMARY KEY,

    enrollment_id BIGINT NOT NULL
        REFERENCES enrollments(id)
        ON DELETE RESTRICT,

    billing_month DATE NOT NULL,

    amount_paise BIGINT NOT NULL
        CHECK (amount_paise > 0),

    due_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fee_dues_billing_month_start
        CHECK (
            billing_month =
            DATE_TRUNC('month', billing_month)::DATE
        ),

    CONSTRAINT fee_dues_enrollment_month_unique
        UNIQUE (enrollment_id, billing_month)
);

CREATE INDEX IF NOT EXISTS idx_fee_dues_enrollment_id
    ON fee_dues(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_fee_dues_due_date
    ON fee_dues(due_date);

CREATE INDEX IF NOT EXISTS idx_fee_dues_status
    ON fee_dues(status);

-- +goose Down
DROP TABLE IF EXISTS fee_dues;
