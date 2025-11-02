import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { ProfileSummary } from "@/components/dashboard/ProfileSummary";
import { ChatSidebar } from "@/components/dashboard/ChatSidebar";
import { QuickLogDialog } from "@/components/dashboard/QuickLogDialog";
import { ProfileAvatar } from "@/components/dashboard/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
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
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
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

            {/* Profile Avatar and Summary */}
            <div className="relative">
              <div className="absolute left-[10%] -top-24 z-10">
                <ProfileAvatar 
                  avatarUrl={profile?.avatar_url}
                  fullName={profile?.full_name}
                  onAvatarUpdate={loadProfile}
                />
              </div>
              <ProfileSummary />
            </div>

            {/* Calendar */}
            <CalendarView 
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Timeline for selected day */}
            <TimelineView selectedDate={selectedDate} />
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
