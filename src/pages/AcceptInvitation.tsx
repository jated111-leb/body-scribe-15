import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid invitation",
        description: "No invitation token found",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    loadInvitation();
  }, [token]);

  // Check if user is already logged in
  useEffect(() => {
    if (user && invitation) {
      // User is logged in - check if their email matches the invitation
      if (user.email === invitation.client_email) {
        setIsExistingUser(true);
      } else {
        toast({
          title: "Email mismatch",
          description: "You're logged in with a different email. Please log out and try again.",
          variant: "destructive",
        });
      }
    }
  }, [user, invitation]);

  const loadInvitation = async () => {
    try {
      // Use service role via edge function since user may not be logged in
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: { 
          action: "validate",
          invitationToken: token 
        },
      });

      if (error || !data?.invitation) {
        toast({
          title: "Invalid or expired invitation",
          description: "This invitation link is no longer valid",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setInvitation(data.invitation);
    } catch (error) {
      console.error("Error loading invitation:", error);
      toast({
        title: "Error",
        description: "Failed to load invitation details",
        variant: "destructive",
      });
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptExistingUser = async () => {
    if (!user || !invitation) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: {
          invitationToken: token,
          userId: user.id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error("Failed to accept invitation");

      toast({
        title: "Invitation accepted!",
        description: "You are now connected with your dietician",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create account
      const { error: signUpError } = await signUp(
        invitation.client_email,
        password,
        fullName
      );

      if (signUpError) throw signUpError;

      // Wait a bit for the user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the newly created user
      const { data: { user: newUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !newUser) throw new Error("User creation failed");

      // Call edge function to complete invitation acceptance
      const { data, error: acceptError } = await supabase.functions.invoke(
        "accept-invitation",
        {
          body: {
            invitationToken: token,
            userId: newUser.id,
          },
        }
      );

      if (acceptError) throw acceptError;
      if (!data?.success) throw new Error("Failed to accept invitation");

      toast({
        title: "Welcome to Life Tracker!",
        description: "Your account has been created successfully",
      });

      navigate("/onboarding");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Existing user flow - just show accept button
  if (isExistingUser && user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Accept Invitation</CardTitle>
            <CardDescription>
              You've been invited to connect with a dietician
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-medium">{user.email}</p>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              By accepting, you agree to share your health data with your dietician
            </p>

            <Button
              className="w-full"
              onClick={handleAcceptExistingUser}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New user flow - show signup form
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>
            Create your account to join Life Tracker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptNewUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.client_email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Accept & Create Account"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to share your health data with your dietician
            </p>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate(`/auth?redirect=/invite?token=${token}`)}
                className="text-sm"
              >
                Already have an account? Log in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
