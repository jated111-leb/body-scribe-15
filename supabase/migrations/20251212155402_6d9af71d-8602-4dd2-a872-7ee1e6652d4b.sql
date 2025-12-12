-- Drop the problematic trigger that causes infinite recursion
DROP TRIGGER IF EXISTS check_expired_invitations ON public.client_invitations;

-- Recreate the trigger to ONLY fire on INSERT (not on UPDATE)
-- This prevents the trigger's UPDATE from re-triggering itself
CREATE TRIGGER check_expired_invitations
AFTER INSERT ON public.client_invitations
FOR EACH STATEMENT
EXECUTE FUNCTION public.expire_old_invitations();