-- SEDS REC Sprint Platform Migration 00003
-- Progressive Web App, Comprehensive Notification System & Admin Role

-- 1. Add ADMIN role and account_status to profiles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
  END IF;
END $$;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'ACTIVE';

-- 2. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Web Browser',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);

-- 3. Notification Priorities & Types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
    CREATE TYPE notification_priority AS ENUM ('INFO', 'IMPORTANT', 'URGENT');
  END IF;
END $$;

-- 4. Expanded Notifications Table
-- Ensure notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'INFO',
  related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  related_sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  related_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  link TEXT,
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In case notifications table was already created by Migration 00001, alter columns safely:
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority notification_priority NOT NULL DEFAULT 'INFO',
  ADD COLUMN IF NOT EXISTS related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS related_sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Drop NOT NULL constraints from 00001 if they exist so either recipient_id or user_id works
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
    ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
    UPDATE notifications SET recipient_id = user_id WHERE recipient_id IS NULL AND user_id IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read') THEN
    ALTER TABLE notifications ALTER COLUMN read DROP NOT NULL;
    UPDATE notifications SET is_read = read WHERE is_read IS FALSE AND read IS TRUE;
  END IF;
END $$;

-- Synchronization trigger to guarantee recipient_id & user_id, is_read & read remain identical
CREATE OR REPLACE FUNCTION sync_notifications_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recipient_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.recipient_id := NEW.user_id;
  ELSIF NEW.user_id IS NULL AND NEW.recipient_id IS NOT NULL THEN
    NEW.user_id := NEW.recipient_id;
  END IF;

  IF NEW.is_read IS NOT NULL THEN
    NEW.read := NEW.is_read;
  ELSIF NEW.read IS NOT NULL THEN
    NEW.is_read := NEW.read;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notifications ON notifications;
CREATE TRIGGER trg_sync_notifications
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION sync_notifications_columns();

-- Indices on notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_id, is_read);

-- 5. User Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  task_assignments BOOLEAN NOT NULL DEFAULT true,
  task_comments BOOLEAN NOT NULL DEFAULT true,
  open_tasks BOOLEAN NOT NULL DEFAULT true,
  sprint_updates BOOLEAN NOT NULL DEFAULT true,
  team_announcements BOOLEAN NOT NULL DEFAULT true,
  manual_notifications BOOLEAN NOT NULL DEFAULT true,
  deadline_reminders BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT false,
  in_app_notifications BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Push Subscriptions RLS
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
ON push_subscriptions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Clean up any existing notifications policies to avoid conflicts
DROP POLICY IF EXISTS "Notifications private to recipient" ON notifications;
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications read status" ON notifications;
DROP POLICY IF EXISTS "Authorized senders create notifications" ON notifications;
DROP POLICY IF EXISTS "Users create notifications" ON notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;

-- Notifications RLS
CREATE POLICY "Users read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = user_id);

CREATE POLICY "Users update own notifications read status"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = user_id)
WITH CHECK (auth.uid() = recipient_id OR auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = user_id);

CREATE POLICY "Users create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Notification Preferences RLS
DROP POLICY IF EXISTS "Users manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users manage own notification preferences"
ON notification_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Add new tables to Realtime Publication if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions, notification_preferences;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
