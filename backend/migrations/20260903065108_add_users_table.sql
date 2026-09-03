-- +goose Up
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,

    email citext UNIQUE NOT NULL,
    password BYTEA NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'student')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role);


-- +goose Down
DROP TABLE IF EXISTS users;
