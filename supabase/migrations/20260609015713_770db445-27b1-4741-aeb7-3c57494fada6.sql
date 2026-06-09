
-- Add delete fields
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_for uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_for_all_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

CREATE INDEX IF NOT EXISTS messages_deleted_for_gin ON public.messages USING GIN (deleted_for);

-- Update protection trigger: allow read_at + delete fields, but never tamper with content/media/etc.
CREATE OR REPLACE FUNCTION public.messages_restrict_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.content     IS DISTINCT FROM OLD.content
   OR NEW.sender_id  IS DISTINCT FROM OLD.sender_id
   OR NEW.match_id   IS DISTINCT FROM OLD.match_id
   OR NEW.created_at IS DISTINCT FROM OLD.created_at
   OR NEW.id         IS DISTINCT FROM OLD.id
   OR NEW.media_url  IS DISTINCT FROM OLD.media_url
   OR NEW.media_type IS DISTINCT FROM OLD.media_type
   OR NEW.duration_ms IS DISTINCT FROM OLD.duration_ms
   OR NEW.width      IS DISTINCT FROM OLD.width
   OR NEW.height     IS DISTINCT FROM OLD.height THEN
    RAISE EXCEPTION 'Only read_at / deleted_* can be updated on messages';
  END IF;

  -- Only the original sender may set deleted_for_all_at
  IF (NEW.deleted_for_all_at IS DISTINCT FROM OLD.deleted_for_all_at
      OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by)
     AND auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.sender_id THEN
    RAISE EXCEPTION 'Only the sender can delete the message for everyone';
  END IF;

  -- deleted_for may only ever grow and only the auth user may add themselves
  IF NEW.deleted_for IS DISTINCT FROM OLD.deleted_for THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'auth required';
    END IF;
    -- removed entries not allowed
    IF EXISTS (
      SELECT 1 FROM unnest(OLD.deleted_for) x WHERE NOT (x = ANY (NEW.deleted_for))
    ) THEN
      RAISE EXCEPTION 'deleted_for is append-only';
    END IF;
    -- newly added entries must equal auth.uid()
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.deleted_for) x
      WHERE NOT (x = ANY (OLD.deleted_for)) AND x <> auth.uid()
    ) THEN
      RAISE EXCEPTION 'You can only add yourself to deleted_for';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Replace UPDATE policy so any match member can update (trigger enforces field-level rules)
DROP POLICY IF EXISTS "Recipient can mark read" ON public.messages;

CREATE POLICY "Match members can update read/delete" ON public.messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
  )
);

-- Audit table
CREATE TABLE IF NOT EXISTS public.message_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('delete_for_me','delete_for_all')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_audit_message_idx ON public.message_audit (message_id);
CREATE INDEX IF NOT EXISTS message_audit_actor_idx ON public.message_audit (actor_id, created_at DESC);

GRANT SELECT, INSERT ON public.message_audit TO authenticated;
GRANT ALL ON public.message_audit TO service_role;

ALTER TABLE public.message_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can insert their own audit"
ON public.message_audit FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);

CREATE POLICY "Admins can read audit"
ON public.message_audit FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
