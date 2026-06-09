
ALTER TABLE public.messages
  ALTER COLUMN content DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image','audio','video')),
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_text_or_media CHECK (
    (content IS NOT NULL AND length(content) > 0) OR media_url IS NOT NULL
  );

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
    RAISE EXCEPTION 'Only read_at can be updated on messages';
  END IF;
  RETURN NEW;
END;
$function$;
