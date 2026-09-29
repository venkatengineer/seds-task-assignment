-- Migration 00007: Sprint Documents & Deliverables
-- Enables storing sprint deliverables and documents directly in the database

CREATE TABLE IF NOT EXISTS public.sprint_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'SPECIFICATION',
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_data TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sprint_documents_sprint_id ON public.sprint_documents(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_documents_team_id ON public.sprint_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_sprint_documents_uploaded_by ON public.sprint_documents(uploaded_by);

ALTER TABLE public.sprint_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sprint_documents' AND policyname = 'sprint_documents_select'
  ) THEN
    CREATE POLICY "sprint_documents_select" ON public.sprint_documents FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sprint_documents' AND policyname = 'sprint_documents_insert'
  ) THEN
    CREATE POLICY "sprint_documents_insert" ON public.sprint_documents FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sprint_documents' AND policyname = 'sprint_documents_update'
  ) THEN
    CREATE POLICY "sprint_documents_update" ON public.sprint_documents FOR UPDATE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sprint_documents' AND policyname = 'sprint_documents_delete'
  ) THEN
    CREATE POLICY "sprint_documents_delete" ON public.sprint_documents FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
