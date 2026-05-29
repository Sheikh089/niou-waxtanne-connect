
-- 1) Restrict UPDATE on messages to the read_at column only (prevents recipients
--    from overwriting another user's message content or sender_id).
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- 2) Hide profiles.whatsapp from broad SELECT. Use column-level grants so the
--    Data API never returns the whatsapp column to other authenticated users.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, display_name, avatar_url, bio, age, gender, looking_for,
  city, country, interests, photos, is_premium, is_verified,
  last_seen, created_at, updated_at, onboarding_completed
) ON public.profiles TO authenticated;
-- Users still need to write to all their own columns (INSERT/UPDATE governed by RLS)
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Security-definer accessor: only returns whatsapp for self or a matched user.
CREATE OR REPLACE FUNCTION public.get_matched_whatsapp(_other uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.whatsapp
  FROM public.profiles p
  WHERE p.id = _other
    AND (
      _other = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.user_a = LEAST(auth.uid(), _other)
          AND m.user_b = GREATEST(auth.uid(), _other)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_matched_whatsapp(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_matched_whatsapp(uuid) TO authenticated;
