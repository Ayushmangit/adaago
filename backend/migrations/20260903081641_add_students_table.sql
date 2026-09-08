-- +goose Up
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT UNIQUE NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,

    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),

    address TEXT,

    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_status
    ON students(status);

CREATE INDEX IF NOT EXISTS idx_students_full_name
    ON students(full_name);

-- +goose Down
DROP TABLE IF EXISTS students;
