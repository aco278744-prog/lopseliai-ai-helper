ALTER TABLE public.courses
ADD COLUMN pending_onboarding_id uuid REFERENCES public.pending_onboarding(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX courses_pending_onboarding_id_unique
ON public.courses (pending_onboarding_id)
WHERE pending_onboarding_id IS NOT NULL;