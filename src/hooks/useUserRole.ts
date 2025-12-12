import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'dietician' | 'client' | null;

const ROLE_PRIORITY: Record<string, number> = {
  admin: 1,
  dietician: 2,
  client: 3,
};

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
        // Single query to get all roles for the user
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user roles:", error);
          setRole(null);
        } else if (data && data.length > 0) {
          // Sort by priority and pick the highest priority role
          const sortedRoles = data.sort((a, b) => 
            (ROLE_PRIORITY[a.role] || 99) - (ROLE_PRIORITY[b.role] || 99)
          );
          setRole(sortedRoles[0].role as UserRole);
        } else {
          setRole(null);
        }
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
