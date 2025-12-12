import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, X, Loader2 } from "lucide-react";

interface PendingInvitation {
  id: string;
  dietician_id: string;
  invitation_token: string;
  dietician_name?: string;
}

export const PendingInvitationBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (user?.email) {
      checkPendingInvitations();
    }
  }, [user?.email]);

  const checkPendingInvitations = async () => {
    try {
      const { data: invitations, error } = await supabase
        .from("client_invitations")
        .select("id, dietician_id, invitation_token")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (error) {
        console.error("Error checking invitations:", error);
        return;
      }

      if (invitations && invitations.length > 0) {
        const inv = invitations[0];
        
        // Get dietician name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", inv.dietician_id)
          .single();

        setInvitation({
          ...inv,
          dietician_name: profile?.full_name || "A dietician",
        });
      }
    } catch (error) {
      console.error("Error checking invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !user) return;
    setAccepting(true);

    try {
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: {
          invitationToken: invitation.invitation_token,
          userId: user.id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error("Failed to accept invitation");

      toast({
        title: "Invitation accepted!",
        description: `You are now connected with ${invitation.dietician_name}`,
      });

      setInvitation(null);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    setDeclining(true);

    try {
      const { error } = await supabase
        .from("client_invitations")
        .update({ status: "declined" })
        .eq("id", invitation.id);

      if (error) throw error;

      toast({
        title: "Invitation declined",
        description: "The invitation has been declined",
      });

      setInvitation(null);
    } catch (error: any) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setDeclining(false);
    }
  };

  if (loading || !invitation) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {invitation.dietician_name} has invited you to be their client
            </p>
            <p className="text-sm text-muted-foreground">
              Accept to share your health data and get personalized guidance
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            disabled={declining || accepting}
          >
            {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
            Decline
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={accepting || declining}
          >
            {accepting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
