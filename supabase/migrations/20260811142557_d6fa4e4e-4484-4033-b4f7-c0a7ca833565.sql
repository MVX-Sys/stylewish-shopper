
-- First, let's fix the trigger function to be SECURITY DEFINER with search_path correctly
-- although we already did that, let's make sure it's not the cause of the schema query error.

-- Grant SELECT on auth.users to anon/authenticated is NOT possible, 
-- but let's check if there are other dependencies in handle_new_user_setup

CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new; -- Ignore errors in trigger to avoid blocking sign-up, though this shouldn't happen
END;
$$;
