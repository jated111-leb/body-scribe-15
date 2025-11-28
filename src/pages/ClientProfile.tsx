import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  Heart, 
  Scale,
  Ruler,
  Calendar,
  Pill,
  AlertCircle,
  Target,
  Flame
} from "lucide-react";

interface ClientProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  age: number | null;
  sex: string | null;
  height: number | null;
  weight: number | null;
  bmr: number | null;
  health_conditions: string[] | null;
  medications: string[] | null;
  allergies: string[] | null;
  goals: string[] | null;
  created_at: string;
}

const ClientProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalEvents: 0,
    thisWeekEvents: 0,
    activeDays: 0,
  });

  useEffect(() => {
    if (user && clientId) {
      loadClientProfile();
      loadStats();
    }
  }, [user, clientId]);

  const loadClientProfile = async () => {
    try {
      // 1. First verify authorization explicitly
      const { data: relationship, error: authError } = await supabase
        .from("dietician_clients")
        .select("*")
        .eq("dietician_id", user.id)
        .eq("client_id", clientId)
        .eq("status", "active")
        .maybeSingle();

      if (authError || !relationship) {
        toast({
          title: "Access denied",
          description: "You are not authorized to view this client's profile",
          variant: "destructive",
        });
        navigate("/dietician-dashboard");
        return;
      }

      // 2. Then fetch profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error: any) {
      console.error("Error loading client profile:", error);
      toast({
        title: "Error",
        description: "Failed to load client profile",
        variant: "destructive",
      });
      navigate("/dietician-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total events
      const { count: totalCount } = await supabase
        .from("timeline_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", clientId);

      // Get this week's events
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weekCount } = await supabase
        .from("timeline_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", clientId)
        .gte("event_date", weekAgo.toISOString());

      // Get unique active days
      const { data: events } = await supabase
        .from("timeline_events")
        .select("event_date")
        .eq("user_id", clientId);

      const uniqueDays = new Set(
        events?.map(e => new Date(e.event_date).toDateString())
      ).size;

      setStats({
        totalEvents: totalCount || 0,
        thisWeekEvents: weekCount || 0,
        activeDays: uniqueDays,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading client profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Client profile not found</p>
            <Button onClick={() => navigate("/dietician-dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dietician-dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-lg">
                  {profile.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-sm text-muted-foreground">
                  Client since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-sm">
              Read-Only View
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeekEvents}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDays}</div>
              <p className="text-xs text-muted-foreground">Days with activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BMR</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile.bmr ? `${profile.bmr}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Calories/day</p>
            </CardContent>
          </Card>
        </div>

        {/* Health Profile */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Health Profile</CardTitle>
            <CardDescription>Client's health information and vital statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Basic Info</h3>
                
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{profile.age || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sex</p>
                    <p className="font-medium">{profile.sex || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Ruler className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p className="font-medium">
                      {profile.height ? `${profile.height} cm` : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">
                      {profile.weight ? `${profile.weight} kg` : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Health Conditions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  Health Conditions
                </h3>
                {profile.health_conditions && profile.health_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.health_conditions.map((condition, idx) => (
                      <Badge key={idx} variant="outline">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None reported</p>
                )}

                <div className="pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    <Pill className="inline h-4 w-4 mr-2" />
                    Medications
                  </h4>
                  {profile.medications && profile.medications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.medications.map((med, idx) => (
                        <Badge key={idx} variant="secondary">
                          {med}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">None reported</p>
                  )}
                </div>

                <div className="pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    <AlertCircle className="inline h-4 w-4 mr-2" />
                    Allergies
                  </h4>
                  {profile.allergies && profile.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.allergies.map((allergy, idx) => (
                        <Badge key={idx} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">None reported</p>
                  )}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  <Target className="inline h-4 w-4 mr-2" />
                  Health Goals
                </h3>
                {profile.goals && profile.goals.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.goals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm">{goal}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No goals set</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <WeeklySummary userId={clientId} />

        {/* Timeline and Calendar */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="summary">Weekly Summary</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <WeeklySummary userId={clientId} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  View all logged activities, meals, and health events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimelineView selectedDate={selectedDate} clientId={clientId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Calendar</CardTitle>
                <CardDescription>
                  Overview of client's logged activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarView
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  clientId={clientId}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientProfile;
