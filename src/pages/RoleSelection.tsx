import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, User } from "lucide-react";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<'dietician' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRoleSelect = async () => {
    if (!selectedRole || !user) return;

    setLoading(true);
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ role: selectedRole })
          .eq("id", existingRole.id);

        if (updateError) throw updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: selectedRole });

        if (insertError) throw insertError;
      }

      // Update profile to mark role as selected
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role_selected: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Role selected",
        description: `You've been registered as a ${selectedRole}.`,
      });

      // Navigate based on role
      if (selectedRole === 'dietician') {
        navigate("/dietician-dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (error: any) {
      console.error("Error selecting role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to select role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you'll be using Life Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === 'dietician' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedRole('dietician')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Dietician</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Manage and monitor multiple clients' health progress
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === 'client' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedRole('client')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Client</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track your personal health journey and goals
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedRole || loading}
            onClick={handleRoleSelect}
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;
