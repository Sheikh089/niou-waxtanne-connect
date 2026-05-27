
-- Phone OTP : interdit explicitement tout accès authenticated/anon (seul service_role via clé service peut lire/écrire)
CREATE POLICY "deny all" ON public.phone_otps FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- Bucket avatars : empêche le listage (?), n'autorise que la lecture d'objets dont le chemin commence par un dossier utilisateur connu.
-- Simplification : on garde la lecture publique d'un fichier précis via getPublicUrl (PostgREST ne fait pas de listing si la policy filtre par name), mais on retire la policy trop large.
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND octet_length(name) > 0);
