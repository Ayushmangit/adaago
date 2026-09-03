-- +goose Up
CREATE TABLE IF NOT EXISTS enrollments (
    id BIGSERIAL PRIMARY KEY,

    student_id BIGINT NOT NULL
        REFERENCES students(id)
        ON DELETE RESTRICT,

    batch_id BIGINT NOT NULL
        REFERENCES batches(id)
        ON DELETE RESTRICT,

    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enrollments_valid_dates
        CHECK (left_at IS NULL OR left_at >= joined_at)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id
    ON enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id
    ON enrollments(batch_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status
    ON enrollments(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_active_student_batch
    ON enrollments(student_id, batch_id)
    WHERE status = 'active';

-- +goose Down
DROP TABLE IF EXISTS enrollments;
