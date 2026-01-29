CREATE EXTENSION citext;

CREATE TABLE
    users (
        id bigserial PRIMARY KEY,
        display_name text NOT NULL,
        avatar_url text NULL,
        created_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    user_credentials (
        user_id bigint PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        login_name text NOT NULL UNIQUE,
        email citext UNIQUE NULL,
        email_pending citext NULL,
        email_verified_at timestamptz NULL,
        password_hash text NOT NULL,
        password_updated_at timestamptz NOT NULL DEFAULT now (),
        created_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    email_verification_tokens (
        user_id bigint PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        token_hash text NOT NULL,
        email citext NOT NULL,
        expires_at timestamptz NOT NULL,
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

CREATE TABLE
    comments (
        id bigserial PRIMARY KEY,
        post_id bigint NOT NULL REFERENCES posts (id) ON DELETE RESTRICT,
        author_id bigint NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now (),
        updated_at timestamptz NOT NULL DEFAULT now (),
        deleted_at timestamptz NULL
    );

CREATE TABLE
    post_likes (
        post_id bigint NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
        user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now (),
        PRIMARY KEY (post_id, user_id)
    );

CREATE INDEX idx_user_credentials_login_name ON user_credentials (login_name);

CREATE INDEX idx_user_credentials_email ON user_credentials (email);

CREATE INDEX ux_user_credentials_email_pending ON user_credentials (email_pending);

CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens (expires_at);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);

CREATE INDEX idx_posts_author_id ON posts (author_id);

CREATE INDEX idx_posts_deleted_at ON posts (deleted_at);

CREATE INDEX idx_comments_post_id ON comments (post_id);

CREATE INDEX idx_comments_author_id ON comments (author_id);

CREATE INDEX idx_comments_deleted_at ON comments (deleted_at);