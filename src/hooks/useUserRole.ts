import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'dietician' | 'client' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check for roles in order of precedence: admin > dietician > client
        const roleHierarchy: UserRole[] = ['admin', 'dietician', 'client'];
        let foundRole: UserRole | null = null;

        for (const checkRole of roleHierarchy) {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", checkRole)
            .maybeSingle();

          if (error) {
            console.error(`Error checking role ${checkRole}:`, error);
            continue;
          }

          if (data) {
            foundRole = data.role as UserRole;
            break;
          }
        }

        setRole(foundRole);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading };
};
