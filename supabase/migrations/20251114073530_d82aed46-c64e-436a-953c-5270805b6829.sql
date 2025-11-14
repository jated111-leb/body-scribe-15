-- Create invitations table
CREATE TABLE public.client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_email TEXT NOT NULL,
  invitation_token UUID DEFAULT gen_random_uuid() NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (dietician_id, client_email, status)
);

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Dieticians can view their own invitations"
  ON public.client_invitations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = dietician_id AND
    public.has_role(auth.uid(), 'dietician')
  );

CREATE POLICY "Dieticians can create invitations"
  ON public.client_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = dietician_id AND
    public.has_role(auth.uid(), 'dietician')
  );

CREATE POLICY "Dieticians can update their invitations"
  ON public.client_invitations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = dietician_id AND
    public.has_role(auth.uid(), 'dietician')
  );

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_invitations
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < now();
  RETURN NULL;
END;
$$;

-- Trigger to run expiration check
CREATE TRIGGER check_expired_invitations
  AFTER INSERT OR UPDATE ON public.client_invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.expire_old_invitations();