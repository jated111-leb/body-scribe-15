-- Update the handle_new_user function to automatically assign client role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with role_selected = true
  INSERT INTO public.profiles (id, full_name, role_selected)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    true
  );
  
  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- Automatically assign 'client' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Fix existing users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- Update all profiles to mark role as selected
UPDATE public.profiles SET role_selected = true WHERE role_selected = false OR role_selected IS NULL;