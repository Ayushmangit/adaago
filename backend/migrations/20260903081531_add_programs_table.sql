-- +goose Up
CREATE TABLE IF NOT EXISTS programs (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO programs (name, description)
VALUES (
    'Astro Turf',
    'Astro turf training and membership program'
)
ON CONFLICT (name) DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS programs;
