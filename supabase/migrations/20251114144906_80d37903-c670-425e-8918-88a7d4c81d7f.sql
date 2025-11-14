-- Fix infinite recursion in user_roles RLS policies
-- The admin policy was calling has_role() which queries user_roles, causing recursion

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate a simpler admin policy that doesn't cause recursion
-- This checks if the user exists in user_roles with admin role directly, without calling has_role()
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
  )
);

-- Also ensure the SECURITY DEFINER function bypasses RLS properly
-- Recreate the has_role function with explicit security definer settings
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;