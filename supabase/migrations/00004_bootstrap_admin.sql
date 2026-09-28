-- ==============================================================================
-- SEDS REC - FIRST ADMIN BOOTSTRAP PROTOCOL (00004_bootstrap_admin.sql)
-- ==============================================================================
-- To bootstrap the initial SEDS Administrator safely:
-- 1. Create an admin user in Supabase Auth (via Supabase Studio -> Authentication -> Add User)
-- 2. Run in Supabase SQL Editor:
--    SELECT public.seds_promote_to_admin('admin@sedsrec.org', 'Lead Administrator');
--
-- After the first admin exists, all subsequent users and team leads must be provisioned
-- strictly via the SEDS Administration Panel (/admin).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.seds_promote_to_admin(target_email TEXT, admin_name TEXT DEFAULT 'SEDS Administrator')
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users. Please create the user in Supabase Auth first.', target_email;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, account_status, created_at, updated_at)
  VALUES (target_user_id, target_email, admin_name, 'ADMIN', 'ACTIVE', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET role = 'ADMIN', account_status = 'ACTIVE', updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.seds_promote_to_admin(TEXT, TEXT) TO postgres, service_role;
