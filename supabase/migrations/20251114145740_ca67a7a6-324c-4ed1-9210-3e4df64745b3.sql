-- Correct RLS to avoid recursion in user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Use security definer function to avoid self-referencing policies
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));