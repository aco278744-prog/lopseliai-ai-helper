CREATE TABLE public.pending_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  handoff_token uuid NOT NULL UNIQUE,
  onboarding jsonb NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pending_onboarding_email_length CHECK (char_length(email) BETWEEN 3 AND 255),
  CONSTRAINT pending_onboarding_payload_object CHECK (jsonb_typeof(onboarding) = 'object')
);

GRANT INSERT ON public.pending_onboarding TO anon;
GRANT SELECT, UPDATE ON public.pending_onboarding TO authenticated;
GRANT ALL ON public.pending_onboarding TO service_role;

ALTER TABLE public.pending_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can save pending onboarding"
ON public.pending_onboarding
FOR INSERT
TO anon
WITH CHECK (
  email = lower(btrim(email))
  AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  AND consumed_at IS NULL
);

CREATE POLICY "Users can read their pending onboarding"
ON public.pending_onboarding
FOR SELECT
TO authenticated
USING (
  email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  AND consumed_at IS NULL
  AND created_at > now() - interval '24 hours'
);

CREATE POLICY "Users can consume their pending onboarding"
ON public.pending_onboarding
FOR UPDATE
TO authenticated
USING (
  email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  AND consumed_at IS NULL
  AND created_at > now() - interval '24 hours'
)
WITH CHECK (
  email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  AND consumed_at IS NOT NULL
);

CREATE INDEX pending_onboarding_email_created_idx
ON public.pending_onboarding (email, created_at DESC)
WHERE consumed_at IS NULL;