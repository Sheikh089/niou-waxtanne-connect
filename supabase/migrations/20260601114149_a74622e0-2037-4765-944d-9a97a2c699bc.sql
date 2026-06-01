-- Add status enum & column to profiles
DO $$ BEGIN
  CREATE TYPE public.profile_status AS ENUM ('active','suspended','banned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.profile_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_note text;

-- Admin actions log
CREATE TABLE IF NOT EXISTS public.admin_user_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_user_actions TO authenticated;
GRANT ALL ON public.admin_user_actions TO service_role;

ALTER TABLE public.admin_user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read actions"
ON public.admin_user_actions FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "admins insert actions"
ON public.admin_user_actions FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_admin_user_actions_target ON public.admin_user_actions(target_user_id, created_at DESC);

-- Replace the restrictive profile update policy so admins can update verification/status
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_premium = (SELECT p.is_premium FROM public.profiles p WHERE p.id = auth.uid())
  AND is_verified = (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
  AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
