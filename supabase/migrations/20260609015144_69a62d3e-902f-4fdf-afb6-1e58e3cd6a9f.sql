
CREATE POLICY "chat-media: owner can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "chat-media: owner can read own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "chat-media: match members can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id::text = (storage.foldername(name))[2]
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);

CREATE POLICY "chat-media: owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
