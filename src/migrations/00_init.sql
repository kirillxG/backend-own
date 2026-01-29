CREATE EXTENSION citext;

CREATE TABLE
    users (
        id bigserial PRIMARY KEY,
        email citext UNIQUE NOT NULL,
        display_name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    user_credentials (
        user_id bigint PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        password_hash text NOT NULL,
        password_updated_at timestamptz NOT NULL DEFAULT now (),
        created_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    roles (
        id bigserial PRIMARY KEY,
        name text UNIQUE NOT NULL
    );

CREATE TABLE
    permissions (
        id bigserial PRIMARY KEY,
        key text UNIQUE NOT NULL
    );

CREATE TABLE
    role_permissions (
        role_id bigint NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
        permission_id bigint NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
    );

CREATE TABLE
    user_roles (
        user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        role_id bigint NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
    );

CREATE TABLE
    posts (
        id bigserial PRIMARY KEY,
        author_id bigint NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
        title text NOT NULL,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now (),
        updated_at timestamptz NOT NULL DEFAULT now (),
        deleted_at timestamptz NULL
    );

CREATE INDEX idx_user_roles_user ON user_roles (user_id);

CREATE INDEX idx_posts_author_id ON posts (author_id);

CREATE INDEX idx_posts_deleted_at ON posts (deleted_at);