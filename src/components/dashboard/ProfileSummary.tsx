import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Activity, Target, Heart, AlertCircle, Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestEvents } from "@/lib/demo";

export const ProfileSummary = () => {
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
    loadActivities();
  }, [user]);

  const loadActivities = async () => {
    try {
      if (!user) {
        // Load from localStorage for guest
        const guestEvents = getGuestEvents();
        const workoutActivities = guestEvents
          .filter(event => event.event_type === 'workout' && event.activity_type)
          .map(event => event.activity_type!)
          .filter((value, index, self) => self.indexOf(value) === index); // unique values
        setActivities(workoutActivities);
      } else {
        // Load from database for authenticated user
        const { data, error } = await supabase
          .from('timeline_events')
          .select('activity_type')
          .eq('user_id', user.id)
          .eq('event_type', 'workout')
          .not('activity_type', 'is', null);

        if (error) throw error;
        
        const uniqueActivities = [...new Set(data.map(item => item.activity_type))].filter(Boolean) as string[];
        setActivities(uniqueActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

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

        {/* Activities/Sports */}
        {activities && activities.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Activities
            </h4>
            <div className="flex flex-wrap gap-2">
              {activities.map((activity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {activity}
                </Badge>
              ))}
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
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Health Notes
            </h4>
            <div className="space-y-1">
              {profile.health_conditions.map((condition: string, idx: number) => (
                <div key={idx} className="text-sm bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-2">
                  {condition}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
