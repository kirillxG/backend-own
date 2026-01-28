CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE
    IF NOT EXISTS users (
        id bigserial PRIMARY KEY,
        email citext UNIQUE NOT NULL,
        display_name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    IF NOT EXISTS user_credentials (
        user_id bigint PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        password_hash text NOT NULL,
        password_updated_at timestamptz NOT NULL DEFAULT now (),
        created_at timestamptz NOT NULL DEFAULT now ()
    );