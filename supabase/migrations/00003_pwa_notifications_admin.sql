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
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'INFO',
  related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  related_sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  related_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Push Subscriptions RLS: users manage only their own devices
CREATE POLICY "Users manage own push subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notifications RLS: recipients can read their own notifications
CREATE POLICY "Users read own notifications"
ON notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Users update own notifications read status"
ON notifications FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Notification Preferences RLS: users manage their own preferences
CREATE POLICY "Users manage own notification preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin & System notification sender policies
CREATE POLICY "Authorized senders create notifications"
ON notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('OFFICE_BEARER', 'TEAM_LEAD', 'ADMIN')
  )
);
