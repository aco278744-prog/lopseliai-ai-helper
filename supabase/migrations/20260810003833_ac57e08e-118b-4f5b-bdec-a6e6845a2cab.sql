DROP POLICY "Visitors can save pending onboarding" ON public.pending_onboarding;
REVOKE INSERT ON public.pending_onboarding FROM anon;