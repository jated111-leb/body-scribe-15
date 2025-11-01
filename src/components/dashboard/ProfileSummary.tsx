import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Activity, Target, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const ProfileSummary = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (!user) {
        // Load from localStorage for guest
        const stored = localStorage.getItem('guestProfile');
        if (stored) {
          const data = JSON.parse(stored);
          setProfile({
            full_name: data.profile?.name || 'Guest',
            age: data.profile?.age,
            sex: data.profile?.sex,
            height: data.profile?.height,
            weight: data.profile?.weight,
            bmr: data.bmr,
            medications: data.health?.supplements?.split('\n').filter(Boolean) || [],
            goals: data.goals?.split('\n').filter(Boolean) || [],
            health_conditions: data.health?.conditions?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
          });
        }
      } else {
        // Load from database for authenticated user
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Health Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Stats
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {profile.age && (
              <div>
                <span className="text-muted-foreground">Age:</span>{' '}
                <span className="font-medium">{profile.age}</span>
              </div>
            )}
            {profile.height && (
              <div>
                <span className="text-muted-foreground">Height:</span>{' '}
                <span className="font-medium">{profile.height} cm</span>
              </div>
            )}
            {profile.weight && (
              <div>
                <span className="text-muted-foreground">Weight:</span>{' '}
                <span className="font-medium">{profile.weight} kg</span>
              </div>
            )}
            {profile.bmr && (
              <div>
                <span className="text-muted-foreground">BMR:</span>{' '}
                <span className="font-medium">{Math.round(profile.bmr)} cal</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Supplements */}
        {profile.medications && profile.medications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Current Supplements
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.medications.slice(0, 3).map((med: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {med.split('-')[0].trim()}
                </Badge>
              ))}
              {profile.medications.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.medications.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Goals */}
        {profile.goals && profile.goals.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals
            </h4>
            <div className="space-y-1">
              {profile.goals.map((goal: string, idx: number) => (
                <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">•</span>
                  {goal}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Conditions */}
        {profile.health_conditions && profile.health_conditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Health Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {profile.health_conditions.map((condition: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
