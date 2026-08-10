CREATE TABLE public.course_templates (
  course_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.course_templates TO authenticated;
GRANT SELECT ON public.course_templates TO anon;
GRANT ALL ON public.course_templates TO service_role;
ALTER TABLE public.course_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates readable by everyone" ON public.course_templates FOR SELECT USING (true);
CREATE POLICY "signed-in users can add templates" ON public.course_templates FOR INSERT TO authenticated WITH CHECK (true);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_key TEXT;