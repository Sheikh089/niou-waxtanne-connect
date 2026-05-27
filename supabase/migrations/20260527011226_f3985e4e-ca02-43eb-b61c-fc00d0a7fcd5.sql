
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker UUID NOT NULL,
  blocked UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker, blocked)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "see own blocks" ON public.blocks;
DROP POLICY IF EXISTS "create own blocks" ON public.blocks;
DROP POLICY IF EXISTS "delete own blocks" ON public.blocks;
CREATE POLICY "see own blocks" ON public.blocks FOR SELECT TO authenticated USING (auth.uid() = blocker);
CREATE POLICY "create own blocks" ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker AND blocker <> blocked);
CREATE POLICY "delete own blocks" ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = blocker);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter UUID NOT NULL,
  reported UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  match_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "see own reports" ON public.reports;
DROP POLICY IF EXISTS "create own reports" ON public.reports;
CREATE POLICY "see own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter);
CREATE POLICY "create own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter AND reporter <> reported);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
DROP POLICY IF EXISTS "Recipient can mark read" ON public.messages;
CREATE POLICY "Recipient can mark read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() <> sender_id AND EXISTS (
    SELECT 1 FROM public.matches m WHERE m.id = messages.match_id AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
  ))
  WITH CHECK (auth.uid() <> sender_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.messages REPLICA IDENTITY FULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TABLE IF NOT EXISTS public.phone_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.phone_otps TO service_role;
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON public.phone_otps(phone, created_at DESC);
