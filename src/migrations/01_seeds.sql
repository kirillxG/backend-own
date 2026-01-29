INSERT INTO
    roles (name)
VALUES
    ('owner'),
    ('admin'),
    ('moderator'),
    ('user');

INSERT INTO
    permissions (key)
VALUES
    -- RBAC / admin
    ('rbac:*'),
    -- User management
    ('user:read'),
    ('user:update'),
    ('user:delete'),
    -- Role assignment
    ('user_role:read'),
    ('user_role:write'),
    -- Moderation
    ('moderation:read'),
    ('moderation:action'),
    -- Content / app domain examples
    ('content:read'),
    ('content:create'),
    ('content:update'),
    ('content:delete')
    -- Posts operations
    ('post:create'),
    ('post:read'),
    ('post:update'),
    ('post:delete');

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    roles r
    JOIN permissions p ON true
WHERE
    r.name = 'owner';

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    roles r
    JOIN permissions p ON p.key IN (
        'rbac:*',
        'user:read',
        'user:update',
        'user:delete',
        'user_role:read',
        'user_role:write',
        'content:*'
    )
WHERE
    r.name = 'admin';

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    roles r
    JOIN permissions p ON p.key IN (
        'moderation:read',
        'moderation:action',
        'content:read',
        'user:read'
    )
WHERE
    r.name = 'moderator';

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    roles r
    JOIN permissions p ON p.key IN ('content:read', 'content:create')
WHERE
    r.name = 'user';