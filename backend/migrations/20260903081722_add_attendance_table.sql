-- +goose Up
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,

    enrollment_id BIGINT NOT NULL
        REFERENCES enrollments(id)
        ON DELETE RESTRICT,

    attendance_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('present', 'absent', 'leave')),

    remarks VARCHAR(255),

    marked_by BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT attendance_enrollment_date_unique
        UNIQUE (enrollment_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date
    ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_id
    ON attendance(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_attendance_status
    ON attendance(status);

-- +goose Down
DROP TABLE IF EXISTS attendance;
