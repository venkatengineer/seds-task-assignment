-- ==============================================================================
-- SEDS REC PLATFORM: MIGRATION 00002 - OPEN TASKS & TASK AUCTION SYSTEM
-- ==============================================================================

-- 1. Extend tasks table with Open Task Auction attributes
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assignment_type TEXT NOT NULL DEFAULT 'DIRECT' CHECK (assignment_type IN ('DIRECT', 'OPEN')),
ADD COLUMN IF NOT EXISTS open_task_status TEXT DEFAULT NULL CHECK (open_task_status IN ('DRAFT', 'PUBLISHED', 'ASSIGNED', 'CANCELLED', 'EXPIRED')),
ADD COLUMN IF NOT EXISTS max_assignees INTEGER NOT NULL DEFAULT 1 CHECK (max_assignees >= 1),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- 2. Create open_task_interests table
CREATE TABLE IF NOT EXISTS open_task_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'INTERESTED' CHECK (status IN ('INTERESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_task_user_interest UNIQUE (task_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_open_status ON tasks(assignment_type, open_task_status);
CREATE INDEX IF NOT EXISTS idx_task_interests_task ON open_task_interests(task_id);
CREATE INDEX IF NOT EXISTS idx_task_interests_user ON open_task_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_task_interests_status ON open_task_interests(status);

-- 3. Enable RLS on open_task_interests
ALTER TABLE open_task_interests ENABLE ROW LEVEL SECURITY;

-- 4. RLS for open_task_interests
-- Members can view their own interests, or Team Leads / Office Bearers can view all interests for their team
CREATE POLICY "View task interests"
    ON open_task_interests FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        auth_is_office_bearer() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = open_task_interests.task_id
              AND t.team_id = auth_user_team_id()
              AND auth_user_role() = 'TEAM_LEAD'
        )
    );

-- Members can submit interest for open published tasks of their team
CREATE POLICY "Members submit interest"
    ON open_task_interests FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = open_task_interests.task_id
              AND t.assignment_type = 'OPEN'
              AND t.open_task_status = 'PUBLISHED'
              AND (t.team_id = auth_user_team_id() OR auth_is_office_bearer())
        )
    );

-- Members can withdraw their pending interest; Leads can approve or reject
CREATE POLICY "Update task interests"
    ON open_task_interests FOR UPDATE
    TO authenticated
    USING (
        (user_id = auth.uid() AND status = 'INTERESTED') OR
        auth_is_office_bearer() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = open_task_interests.task_id
              AND t.team_id = auth_user_team_id()
              AND auth_user_role() = 'TEAM_LEAD'
        )
    );

-- 5. Update tasks SELECT policy to allow team members to discover published Open Tasks
DROP POLICY IF EXISTS "Tasks viewable by permission" ON tasks;

CREATE POLICY "Tasks viewable by permission"
    ON tasks FOR SELECT
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id()) OR
        (auth_user_role() = 'TEAM_MEMBER' AND auth_is_assigned_to_task(id)) OR
        (auth_user_role() = 'TEAM_MEMBER' AND assignment_type = 'OPEN' AND open_task_status = 'PUBLISHED' AND team_id = auth_user_team_id())
    );

-- 6. Add to Realtime Publication if available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE open_task_interests;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
