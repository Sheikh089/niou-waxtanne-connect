
-- 1) Restrict whatsapp column on profiles: revoke direct SELECT access.
-- Matched users still get it via public.get_matched_whatsapp() (SECURITY DEFINER).
REVOKE SELECT (whatsapp) ON public.profiles FROM anon, authenticated;
GRANT SELECT (whatsapp) ON public.profiles TO service_role;

-- Allow users to read/write their own whatsapp
GRANT SELECT (whatsapp), UPDATE (whatsapp) ON public.profiles TO authenticated;
-- The grant above re-grants to all authenticated; instead use a row-level approach
-- via the existing 'Users can update own profile' policy. Revoke broad SELECT, then
-- re-grant column SELECT only is not possible row-scoped in PG; so we rely on:
--   * RLS SELECT policy still returns row (without whatsapp accessible via column ACL)
--   * Self-access through the helper function or self-query
-- Re-revoke to lock down again, keeping update for self via RLS WITH CHECK:
REVOKE SELECT (whatsapp) ON public.profiles FROM authenticated;

-- Helper for the owner to read their own whatsapp safely
CREATE OR REPLACE FUNCTION public.get_my_whatsapp()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT whatsapp FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_whatsapp() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_whatsapp() TO authenticated;

-- 2) Prevent recipients from editing message content/sender/match via trigger.
CREATE OR REPLACE FUNCTION public.messages_restrict_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.match_id IS DISTINCT FROM OLD.match_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Only read_at can be updated on messages';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_restrict_update_trg ON public.messages;
CREATE TRIGGER messages_restrict_update_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.messages_restrict_update();

-- 3) Explicit RESTRICTIVE deny policies on admin_login_logs for non-service-role.
-- Writes already implicitly blocked (no permissive policy), but be explicit.
CREATE POLICY "deny insert admin_login_logs"
  ON public.admin_login_logs
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "deny update admin_login_logs"
  ON public.admin_login_logs
  AS RESTRICTIVE
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "deny delete admin_login_logs"
  ON public.admin_login_logs
  AS RESTRICTIVE
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- Lock down EXECUTE on SECURITY DEFINER functions to least privilege.
-- has_role / is_admin must remain callable by authenticated (used in RLS via auth.uid()).
-- get_matched_whatsapp is for authenticated users only.
REVOKE EXECUTE ON FUNCTION public.get_matched_whatsapp(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_matched_whatsapp(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
