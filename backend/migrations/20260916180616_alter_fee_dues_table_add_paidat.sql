-- +goose Up
ALTER TABLE fee_dues
ADD COLUMN paid_at TIMESTAMPTZ,
ADD COLUMN marked_paid_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_fee_dues_marked_paid_by
ON fee_dues(marked_paid_by)
WHERE marked_paid_by IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_fee_dues_marked_paid_by;

ALTER TABLE fee_dues
DROP COLUMN IF EXISTS marked_paid_by,
DROP COLUMN IF EXISTS paid_at;
