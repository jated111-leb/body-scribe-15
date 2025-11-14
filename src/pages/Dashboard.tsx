import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { TimelineFeed } from "@/components/dashboard/TimelineFeed";
import { ProfileSummary } from "@/components/dashboard/ProfileSummary";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { Achievements } from "@/components/dashboard/Achievements";
import { ChatSidebar } from "@/components/dashboard/ChatSidebar";
import { QuickLogDialog } from "@/components/dashboard/QuickLogDialog";
import { ProfileAvatar } from "@/components/dashboard/ProfileAvatar";
import { updateAchievementsForUser } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Calendar, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user, signOut, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect dieticians to their specialized dashboard
  useEffect(() => {
    if (!roleLoading && role === "dietician") {
      navigate("/dietician-dashboard");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      updateAchievementsForUser(user.id);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
    } else {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Calendar + Timeline */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header with Profile Avatar */}
            <div className="flex justify-between items-start gap-4">
              <ProfileAvatar 
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name}
                onAvatarUpdate={loadProfile}
              />
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold">Your Health Timeline</h1>
                <p className="text-muted-foreground">
                  Welcome to Life Tracker!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  className="bg-gradient-primary shadow-glow"
                  onClick={() => setShowQuickLog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Quick Log
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/settings")}
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Profile Summary */}
            <ProfileSummary />

            {/* Weekly Summary */}
            <WeeklySummary />

            {/* Achievements */}
            {user && <Achievements userId={user.id} />}

            {/* Tabs for Calendar and Timeline */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="timeline" className="gap-2">
                  <List className="h-4 w-4" />
                  Timeline Feed
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-0">
                <TimelineFeed />
              </TabsContent>

              <TabsContent value="calendar" className="mt-0 space-y-6">
                <CalendarView 
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <TimelineView selectedDate={selectedDate} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: Chat Assistant */}
        <ChatSidebar />
      </div>

      {/* Quick Log Dialog */}
      <QuickLogDialog 
        open={showQuickLog}
        onOpenChange={setShowQuickLog}
      />
    </div>
  );
};

export default Dashboard;
