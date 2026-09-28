-- ==============================================================================
-- SEDS REC PLATFORM: MIGRATION 00005 - FIX RLS POLICIES FOR ADMIN ROLE & PROFILE CREATION
-- ==============================================================================

-- 1. Ensure user_role enum contains 'ADMIN'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';

-- 2. Update auth_is_office_bearer() to recognize ADMIN role & provide setup bootstrap
CREATE OR REPLACE FUNCTION auth_is_office_bearer()
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Direct profile check for OFFICE_BEARER or ADMIN
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('OFFICE_BEARER', 'ADMIN')
    ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Check JWT metadata in case profile sync is in-flight
    IF (auth.jwt() -> 'user_metadata' ->> 'role') IN ('OFFICE_BEARER', 'ADMIN') OR
       (auth.jwt() -> 'app_metadata' ->> 'role') IN ('OFFICE_BEARER', 'ADMIN') THEN
        RETURN TRUE;
    END IF;

    -- 3. Bootstrap safeguard: If organization has 0 teams, allow current authenticated user
    -- to create the initial foundation teams without hitting an RLS roadblock
    IF NOT EXISTS (SELECT 1 FROM public.teams LIMIT 1) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update auth_user_role() helper
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
DECLARE
    u_role user_role;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
    IF u_role IS NOT NULL THEN
        RETURN u_role;
    END IF;

    IF (auth.jwt() -> 'user_metadata' ->> 'role') IS NOT NULL THEN
        RETURN (auth.jwt() -> 'user_metadata' ->> 'role')::user_role;
    END IF;

    RETURN 'TEAM_MEMBER'::user_role;
EXCEPTION WHEN OTHERS THEN
    RETURN 'TEAM_MEMBER'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix Teams RLS Policies
DROP POLICY IF EXISTS "Teams manageable only by Office Bearers" ON teams;
CREATE POLICY "Teams manageable only by Office Bearers"
    ON teams FOR ALL
    TO authenticated
    USING (auth_is_office_bearer())
    WITH CHECK (auth_is_office_bearer());

-- 5. Fix Profiles RLS Policies (Allow Insert, Update, Delete)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid() OR auth_is_office_bearer());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR auth_is_office_bearer())
    WITH CHECK (id = auth.uid() OR auth_is_office_bearer());

DROP POLICY IF EXISTS "Users can delete profiles if office bearer" ON profiles;
CREATE POLICY "Users can delete profiles if office bearer"
    ON profiles FOR DELETE
    TO authenticated
    USING (auth_is_office_bearer());

-- 6. Automatic Profile Creation Trigger for Supabase Auth Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, account_status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1), 'SEDS Member'),
    CASE 
      -- The first user to exist in profiles is granted ADMIN
      WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'ADMIN'::user_role
      ELSE COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'TEAM_MEMBER'::user_role)
    END,
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. First-Team Creator Bootstrap Trigger
CREATE OR REPLACE FUNCTION public.trg_bootstrap_first_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT count(*) FROM public.teams) <= 1 AND auth.uid() IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'ADMIN', account_status = 'ACTIVE', updated_at = NOW() 
        WHERE id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_team_insert_bootstrap ON teams;
CREATE TRIGGER trg_after_team_insert_bootstrap
AFTER INSERT ON teams
FOR EACH ROW EXECUTE FUNCTION public.trg_bootstrap_first_admin();

-- 8. Backfill and sync all existing registered auth.users into profiles as ADMIN
INSERT INTO public.profiles (id, email, full_name, role, account_status, created_at, updated_at)
SELECT 
  u.id, 
  COALESCE(u.email, ''), 
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, ''), '@', 1), 'SEDS Member'), 
  'ADMIN'::user_role,
  'ACTIVE',
  NOW(),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET role = 'ADMIN', account_status = 'ACTIVE', updated_at = NOW();
