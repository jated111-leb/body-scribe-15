import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'dietician' | 'client';
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireRole,
  requireAuth = true 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [roleSelected, setRoleSelected] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user has selected a role in their profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setRoleSelected(null);
        setCheckingProfile(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role_selected")
        .eq("id", user.id)
        .maybeSingle();

      setRoleSelected(profile?.role_selected ?? false);
      setCheckingProfile(false);
    };

    checkProfile();
  }, [user]);

  useEffect(() => {
    // Wait for all loading to complete
    if (authLoading || checkingProfile) return;

    // If auth is required and user is not logged in, redirect to auth page
    if (requireAuth && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    // If user is logged in, check profile and role
    if (user && !roleLoading) {
      const currentPath = window.location.pathname;
      
      // User hasn't selected a role yet, send to role selection
      // Only redirect when roleSelected is explicitly false (not when role is still loading)
      if (roleSelected === false) {
        navigate("/role-selection", { replace: true });
        return;
      }

      // Check onboarding completion from the profile we already fetched
      const checkOnboardingCompletion = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        const onboardingCompleted = profile?.onboarding_completed ?? false;

        // If onboarding not completed, redirect to appropriate onboarding page
        if (!onboardingCompleted) {
          if (role === "dietician" && currentPath !== "/dietician-onboarding") {
            navigate("/dietician-onboarding", { replace: true });
            return;
          } else if (role === "client" && currentPath !== "/onboarding") {
            navigate("/onboarding", { replace: true });
            return;
          }
        }

        // If a specific role is required, check if user has it
        if (requireRole && role !== requireRole) {
          // Redirect based on their actual role
          if (role === "dietician") {
            navigate("/dietician-dashboard", { replace: true });
          } else if (role === "client") {
            navigate("/dashboard", { replace: true });
          }
        }
      };

      checkOnboardingCompletion();
    }
  }, [user, role, authLoading, roleLoading, checkingProfile, roleSelected, requireAuth, requireRole, navigate]);

  // Show loading while checking authentication, profile, and role
  if (authLoading || checkingProfile || (user && roleLoading)) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render children until auth check is complete
  if (requireAuth && !user) {
    return null;
  }

  // Don't render if waiting for profile or role
  if (user && (checkingProfile || roleLoading)) {
    return null;
  }

  // Don't render children until role is loaded when a specific role is required
  if (requireRole && !role) {
    return null;
  }

  return <>{children}</>;
};
