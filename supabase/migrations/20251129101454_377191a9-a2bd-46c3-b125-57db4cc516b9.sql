-- Fix handle_new_user() trigger to NOT auto-assign role
-- Users must choose their role after signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with role_selected = FALSE (user must choose)
  INSERT INTO public.profiles (id, full_name, role_selected)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false  -- Changed from true - user must select role
  );
  
  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- NO automatic role assignment - removed the auto-insert to user_roles
  -- User will choose role on the role-selection page
  
  RETURN NEW;
END;
$$;