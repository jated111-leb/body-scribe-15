-- Add RLS policy for clients to view their own invitations by email
-- First we need a way to get the user's email from auth.users
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;

-- Allow clients to see invitations sent to their email
CREATE POLICY "Users can view invitations to their email" 
ON public.client_invitations 
FOR SELECT 
USING (
  client_email = public.get_user_email(auth.uid())
);

-- Allow the accept-invitation edge function to update invitation status
-- (it uses service role, but this is for direct client updates if needed)
CREATE POLICY "Users can update their own invitations" 
ON public.client_invitations 
FOR UPDATE 
USING (
  client_email = public.get_user_email(auth.uid())
);