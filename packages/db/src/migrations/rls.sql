-- Post-migration: RLS policies, helper functions, and the application role.
-- Idempotent: safe to run on every deploy.
--
-- Source of truth for tenant isolation. Application connections must:
--   1. SET LOCAL ROLE app_user
--   2. SET LOCAL app.current_business_id = '<uuid>'
--   3. (Optional) SET LOCAL app.is_super_admin = 'true' for super-admin paths
-- All inside a single transaction so the settings are scoped to the request.

-- ============================================================================
-- Application role
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ============================================================================
-- Context helpers
-- ============================================================================

CREATE OR REPLACE FUNCTION current_business_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_business_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.is_super_admin', true), '')::boolean, false)
$$;

GRANT EXECUTE ON FUNCTION current_business_id() TO app_user;
GRANT EXECUTE ON FUNCTION is_super_admin() TO app_user;

-- ============================================================================
-- RLS on tenant-scoped tables (the ones with a `business_id` column)
-- ============================================================================

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'locations',
    'memberships',
    'roles',
    'membership_location_scopes',
    'audit_logs',
    'products',
    'product_variants',
    'categories',
    'inventory_levels',
    'inventory_movements',
    'customers',
    'sales',
    'sale_lines',
    'payments',
    'refunds'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (business_id = current_business_id() OR is_super_admin())
         WITH CHECK (business_id = current_business_id() OR is_super_admin())',
      t
    );
  END LOOP;
END
$$;

-- audit_logs has a nullable business_id (platform-level events). Allow super
-- admins to insert/select rows with NULL business_id; everyone else is bound
-- to their tenant.
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs
  USING (
    is_super_admin()
    OR (business_id IS NOT NULL AND business_id = current_business_id())
  )
  WITH CHECK (
    is_super_admin()
    OR (business_id IS NOT NULL AND business_id = current_business_id())
  );

-- role_permissions has no business_id; isolation is enforced via the parent
-- role row.
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON role_permissions;
CREATE POLICY tenant_isolation ON role_permissions
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.business_id = current_business_id()
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.business_id = current_business_id()
    )
  );

-- ============================================================================
-- Platform tables: not tenant-scoped, but app_user must not list every user
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_or_member ON users;
-- An app_user query can see itself, or users who share a membership with the
-- current business. Super admins see everyone.
CREATE POLICY users_self_or_member ON users
  USING (
    is_super_admin()
    OR id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = users.id
        AND m.business_id = current_business_id()
    )
  )
  WITH CHECK (
    is_super_admin()
    OR id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_owner_only ON sessions;
CREATE POLICY sessions_owner_only ON sessions
  USING (
    is_super_admin()
    OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  )
  WITH CHECK (
    is_super_admin()
    OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS businesses_member_only ON businesses;
CREATE POLICY businesses_member_only ON businesses
  USING (
    is_super_admin()
    OR id = current_business_id()
  )
  WITH CHECK (
    is_super_admin()
    OR id = current_business_id()
  );
