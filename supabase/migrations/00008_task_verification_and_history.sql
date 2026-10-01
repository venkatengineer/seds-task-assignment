-- ==============================================================================
-- SEDS REC PLATFORM: MIGRATION 00008 - TASK VERIFICATION & TASK HISTORY
-- ==============================================================================

-- 1. Extend tasks table with verification columns
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Indexes for fast filtering on the board and in task history
CREATE INDEX IF NOT EXISTS idx_tasks_is_verified ON public.tasks(is_verified);
CREATE INDEX IF NOT EXISTS idx_tasks_verified_by ON public.tasks(verified_by);
CREATE INDEX IF NOT EXISTS idx_tasks_team_verified ON public.tasks(team_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_tasks_status_verified ON public.tasks(status, is_verified);
