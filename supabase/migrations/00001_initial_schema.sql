-- ==============================================================================
-- SEDS REC PLATFORM: INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Production PostgreSQL schema for Supabase
-- ==============================================================================

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER');
CREATE TYPE sprint_status AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE task_status AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- 2. Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'Rocket',
    color TEXT DEFAULT '#6366f1',
    accent TEXT DEFAULT 'indigo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles Table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'TEAM_MEMBER',
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Team Members Table (Explicit membership mapping)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    membership_role user_role NOT NULL DEFAULT 'TEAM_MEMBER',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_team UNIQUE (user_id) -- Normal user can only belong to one team
);

-- 5. Sprints Table
CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status sprint_status NOT NULL DEFAULT 'PLANNED',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status task_status NOT NULL DEFAULT 'BACKLOG',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    due_date DATE,
    story_points INTEGER NOT NULL DEFAULT 1 CHECK (story_points >= 0),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Task Assignees Table (Many-to-many collaborative tasks)
CREATE TABLE task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_task_assignee UNIQUE (task_id, user_id)
);

-- 8. Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Activity Logs Table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Announcements Table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- NULL means organization-wide
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Lead Messages Table (direct communication with team leads)
CREATE TABLE lead_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    reply TEXT,
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_team_id ON profiles(team_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_sprints_team_status ON sprints(team_id, status);
CREATE INDEX idx_tasks_team_status ON tasks(team_id, status);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_activity_team ON activity_logs(team_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);

-- ==============================================================================
-- HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Check if current authenticated user is an Office Bearer
CREATE OR REPLACE FUNCTION auth_is_office_bearer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'OFFICE_BEARER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current authenticated user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
DECLARE
    u_role user_role;
BEGIN
    SELECT role INTO u_role FROM profiles WHERE id = auth.uid();
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current authenticated user's team_id
CREATE OR REPLACE FUNCTION auth_user_team_id()
RETURNS UUID AS $$
DECLARE
    t_id UUID;
BEGIN
    SELECT team_id INTO t_id FROM profiles WHERE id = auth.uid();
    RETURN t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current authenticated user is a lead for a specific team
CREATE OR REPLACE FUNCTION auth_is_team_lead(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth_is_office_bearer() THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
          AND role = 'TEAM_LEAD' 
          AND team_id = check_team_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current authenticated user is assigned to a specific task
CREATE OR REPLACE FUNCTION auth_is_assigned_to_task(check_task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM task_assignees
        WHERE task_id = check_task_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- TEAMS POLICIES
-- Office Bearers can view & manage all teams.
-- Leads & Members can view all team directories (metadata) or their own team.
-- ------------------------------------------------------------------------------
CREATE POLICY "Teams viewable by all authenticated users"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Teams manageable only by Office Bearers"
    ON teams FOR ALL
    TO authenticated
    USING (auth_is_office_bearer());

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- Anyone authenticated can view member profiles.
-- Users can update their own profile; Office Bearers can manage all profiles.
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR auth_is_office_bearer());

-- ------------------------------------------------------------------------------
-- SPRINTS POLICIES
-- Office Bearers can view and manage sprints for any team.
-- Team Leads can view and manage sprints for their own team.
-- Team Members can view sprints for their own team only.
-- ------------------------------------------------------------------------------
CREATE POLICY "Sprints viewable by team members or Office Bearer"
    ON sprints FOR SELECT
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        team_id = auth_user_team_id()
    );

CREATE POLICY "Sprints manageable by Team Leads and Office Bearers"
    ON sprints FOR INSERT
    TO authenticated
    WITH CHECK (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id())
    );

CREATE POLICY "Sprints editable by Team Leads and Office Bearers"
    ON sprints FOR UPDATE
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id())
    );

CREATE POLICY "Sprints deletable by Office Bearers only"
    ON sprints FOR DELETE
    TO authenticated
    USING (auth_is_office_bearer());

-- ------------------------------------------------------------------------------
-- TASKS POLICIES
-- Office Bearer: Full access to all tasks.
-- Team Lead: Full access to tasks of their own team.
-- Team Member: Can SELECT ONLY tasks they are assigned to (or collaborative tasks).
-- Team Member: Can UPDATE status only on tasks they are assigned to.
-- Team Member: CANNOT insert or delete tasks!
-- ------------------------------------------------------------------------------
CREATE POLICY "Tasks viewable by permission"
    ON tasks FOR SELECT
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id()) OR
        (auth_user_role() = 'TEAM_MEMBER' AND auth_is_assigned_to_task(id))
    );

CREATE POLICY "Tasks insertable by Leads and Office Bearers"
    ON tasks FOR INSERT
    TO authenticated
    WITH CHECK (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id())
    );

CREATE POLICY "Tasks updatable by authorized users"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id()) OR
        (auth_user_role() = 'TEAM_MEMBER' AND auth_is_assigned_to_task(id))
    );

CREATE POLICY "Tasks deletable by Leads and Office Bearers"
    ON tasks FOR DELETE
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id())
    );

-- ------------------------------------------------------------------------------
-- TASK ASSIGNEES POLICIES
-- Assignees are visible if the user can see the underlying task.
-- Assignees can be managed by Office Bearers and Team Leads for their team.
-- ------------------------------------------------------------------------------
CREATE POLICY "Task assignees viewable if task viewable"
    ON task_assignees FOR SELECT
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignees.task_id
              AND (t.team_id = auth_user_team_id() OR auth_is_assigned_to_task(t.id))
        )
    );

CREATE POLICY "Task assignees manageable by Leads and Office Bearers"
    ON task_assignees FOR ALL
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignees.task_id
              AND t.team_id = auth_user_team_id()
              AND auth_user_role() = 'TEAM_LEAD'
        )
    );

-- ------------------------------------------------------------------------------
-- COMMENTS POLICIES
-- Comments viewable only if user can view the task.
-- Comments insertable by users who can view the task.
-- ------------------------------------------------------------------------------
CREATE POLICY "Comments viewable by task viewers"
    ON comments FOR SELECT
    TO authenticated
    USING (
        auth_is_office_bearer() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = comments.task_id
              AND (
                  (auth_user_role() = 'TEAM_LEAD' AND t.team_id = auth_user_team_id()) OR
                  auth_is_assigned_to_task(t.id)
              )
        )
    );

CREATE POLICY "Comments insertable by task viewers"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid() AND (
            auth_is_office_bearer() OR
            EXISTS (
                SELECT 1 FROM tasks t
                WHERE t.id = comments.task_id
                  AND (
                      (auth_user_role() = 'TEAM_LEAD' AND t.team_id = auth_user_team_id()) OR
                      auth_is_assigned_to_task(t.id)
                  )
            )
        )
    );

-- ------------------------------------------------------------------------------
-- ANNOUNCEMENTS POLICIES
-- Org-wide announcements (team_id IS NULL) are viewable by all.
-- Team announcements are viewable by members of that team or Office Bearers.
-- Office Bearers can create org-wide or team announcements.
-- Team Leads can create announcements for their team only.
-- ------------------------------------------------------------------------------
CREATE POLICY "Announcements viewable"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        team_id IS NULL OR
        team_id = auth_user_team_id() OR
        auth_is_office_bearer()
    );

CREATE POLICY "Announcements insertable"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        auth_is_office_bearer() OR
        (auth_user_role() = 'TEAM_LEAD' AND team_id = auth_user_team_id())
    );

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- Users can only see and update their own notifications.
-- ------------------------------------------------------------------------------
CREATE POLICY "Notifications private to recipient"
    ON notifications FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- REALTIME PUBLICATION SETUP
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tasks, task_assignees, comments, announcements, notifications, activity_logs;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Realtime publication might not exist in standard local postgres without supabase extensions
    NULL;
END $$;
