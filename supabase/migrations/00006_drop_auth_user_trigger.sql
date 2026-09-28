-- ==============================================================================
-- SEDS REC PLATFORM: MIGRATION 00006 - DROP AUTH USER TRIGGER
-- ==============================================================================
-- User provisioning is handled authoritatively by /api/admin/users using the
-- Supabase Service Role Admin API. Removing the trigger from auth.users prevents
-- RLS conflicts during GoTrue user creation.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
