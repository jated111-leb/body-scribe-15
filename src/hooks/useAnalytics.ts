import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/lib/analytics';

export const useAnalytics = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Identify user when authenticated
      analytics.identify(user.id, {
        email: user.email,
        created_at: user.created_at,
      });
    } else {
      // Reset analytics when signed out
      analytics.reset();
    }
  }, [user]);

  return analytics;
};
