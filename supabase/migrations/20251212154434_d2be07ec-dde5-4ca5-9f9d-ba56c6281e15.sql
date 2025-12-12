-- Drop existing policies on client_invitations that use has_role function
DROP POLICY IF EXISTS "Dieticians can create invitations" ON public.client_invitations;
DROP POLICY IF EXISTS "Dieticians can update their invitations" ON public.client_invitations;
DROP POLICY IF EXISTS "Dieticians can view their own invitations" ON public.client_invitations;

-- Recreate simpler policies without has_role function (service role bypasses anyway)
-- For regular authenticated users, just check dietician_id directly
CREATE POLICY "Dieticians can create invitations" 
ON public.client_invitations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = dietician_id);

CREATE POLICY "Dieticians can view their own invitations" 
ON public.client_invitations 
FOR SELECT 
TO authenticated
USING (auth.uid() = dietician_id OR client_email = get_user_email(auth.uid()));

CREATE POLICY "Dieticians can update their invitations" 
ON public.client_invitations 
FOR UPDATE 
TO authenticated
USING (auth.uid() = dietician_id OR client_email = get_user_email(auth.uid()));

-- Drop the redundant public policies
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.client_invitations;
DROP POLICY IF EXISTS "Users can view invitations to their email" ON public.client_invitations;