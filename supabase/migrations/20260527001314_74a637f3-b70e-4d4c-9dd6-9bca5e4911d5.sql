
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_premium  = (SELECT p.is_premium  FROM public.profiles p WHERE p.id = auth.uid())
  AND is_verified = (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "Users see own likes" ON public.likes;
CREATE POLICY "Users see own likes"
ON public.likes
FOR SELECT
TO authenticated
USING (
  auth.uid() = from_user
  OR (
    auth.uid() = to_user
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.user_a = LEAST(likes.from_user, likes.to_user)
        AND m.user_b = GREATEST(likes.from_user, likes.to_user)
    )
  )
);
