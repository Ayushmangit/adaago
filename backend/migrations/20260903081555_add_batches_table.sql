-- +goose Up
CREATE TABLE IF NOT EXISTS batches (
    id BIGSERIAL PRIMARY KEY,

    program_id BIGINT NOT NULL
        REFERENCES programs(id)
        ON DELETE RESTRICT,

    name VARCHAR(100) NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    weekdays SMALLINT[] NOT NULL,

    monthly_fee_paise BIGINT NOT NULL
        CHECK (monthly_fee_paise >= 0),

    capacity INTEGER
        CHECK (capacity IS NULL OR capacity > 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT batches_valid_time
        CHECK (end_time > start_time),

    CONSTRAINT batches_valid_weekdays
        CHECK (
            cardinality(weekdays) > 0
            AND weekdays <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[]
        ),

    CONSTRAINT batches_program_name_unique
        UNIQUE (program_id, name)
);

CREATE INDEX IF NOT EXISTS idx_batches_program_id
    ON batches(program_id);

CREATE INDEX IF NOT EXISTS idx_batches_is_active
    ON batches(is_active);

-- +goose Down
DROP TABLE IF EXISTS batches;
