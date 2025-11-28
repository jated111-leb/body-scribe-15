import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

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

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If auth is required and user is not logged in, redirect to auth page
    if (requireAuth && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    // If user is logged in, check for role
    if (user && !roleLoading) {
      // User has no role assigned, send to role selection
      if (!role) {
        navigate("/role-selection", { replace: true });
        return;
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
    }
  }, [user, role, authLoading, roleLoading, requireAuth, requireRole, navigate]);

  // Show loading while checking authentication and role
  if (authLoading || (user && roleLoading)) {
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

  // Don't render if waiting for role
  if (user && roleLoading) {
    return null;
  }

  return <>{children}</>;
};
