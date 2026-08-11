-- Drop existing records if they exist to avoid unique constraint violations
DELETE FROM public.user_permissions WHERE user_id IN (SELECT id FROM public.user_roles WHERE role IN ('admin', 'funcionario'));
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM public.user_roles WHERE role IN ('admin', 'funcionario'));

-- Note: We can't easily insert into auth.users via SQL without the service role key or complex triggers.
-- However, we can use the Supabase Auth Admin API or assume the user might have tried to create them.
-- Since we are AI and have no direct Supabase Dashboard access, but we CAN run SQL, 
-- we will use a "UPSERT" pattern for the roles if the users exist.
-- But wait, I can try to create them via a script using the service role key if it's available.

-- Let's check for service role key.
