import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteClientDialog } from "@/components/dietician/InviteClientDialog";
import { ClientSummariesView } from "@/components/dietician/ClientSummariesView";
import { ClientAlerts } from "@/components/dietician/ClientAlerts";
import { ClientOverviewCard } from "@/components/dietician/ClientOverviewCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, UserPlus, Users, TrendingUp, Sparkles } from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  status: string;
  is_pinned: boolean;
  last_activity?: string;
}

const DieticianDashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadClients();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const loadClients = async () => {
    if (!user) return;

    try {
      // Get dietician's clients
      const { data: relationships, error: relError } = await supabase
        .from("dietician_clients")
        .select("client_id, status, is_pinned")
        .eq("dietician_id", user.id);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Get client profiles
      const clientIds = relationships.map(r => r.client_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", clientIds);

      if (profileError) throw profileError;

      // Combine data
      const clientsData: Client[] = profiles?.map(profile => {
        const relationship = relationships.find(r => r.client_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || "Unknown",
          avatar_url: profile.avatar_url,
          email: "",
          status: relationship?.status || "active",
          is_pinned: relationship?.is_pinned || false,
        };
      }) || [];

      setClients(clientsData);
    } catch (error: any) {
      console.error("Error loading clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pinnedClients = clients.filter(c => c.is_pinned);
  const activeClients = clients.filter(c => c.status === "active");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Dietician Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your clients</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pinned Clients</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pinnedClients.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Client Button */}
        <div className="flex justify-end mb-6">
          <Button className="bg-gradient-primary shadow-glow" onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Client Alerts */}
        <div className="mb-6">
          <ClientAlerts />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="summaries">Weekly Summaries</TabsTrigger>
            <TabsTrigger value="all">All Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading clients...</p>
            ) : (
              <>
                {/* Pinned Clients */}
                {pinnedClients.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Pinned Clients
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pinnedClients.map((client) => (
                        <ClientOverviewCard
                          key={client.id}
                          clientId={client.id}
                          clientName={client.full_name}
                          clientAvatar={client.avatar_url}
                          status={client.status}
                          isPinned={client.is_pinned}
                          dieticianId={user!.id}
                          onPinToggle={loadClients}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Active Clients */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">All Active Clients</h2>
                  {activeClients.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">No active clients yet</p>
                        <Button onClick={() => setShowInviteDialog(true)}>Add Your First Client</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeClients.map((client) => (
                        <ClientOverviewCard
                          key={client.id}
                          clientId={client.id}
                          clientName={client.full_name}
                          clientAvatar={client.avatar_url}
                          status={client.status}
                          isPinned={client.is_pinned}
                          dieticianId={user!.id}
                          onPinToggle={loadClients}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="summaries" className="mt-6">
            <ClientSummariesView />
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading clients...</p>
            ) : clients.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No clients yet</p>
                  <Button onClick={() => setShowInviteDialog(true)}>Add Your First Client</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <ClientOverviewCard
                    key={client.id}
                    clientId={client.id}
                    clientName={client.full_name}
                    clientAvatar={client.avatar_url}
                    status={client.status}
                    isPinned={client.is_pinned}
                    dieticianId={user!.id}
                    onPinToggle={loadClients}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <InviteClientDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        dieticianName={profile?.full_name || "Your Dietician"}
        onInviteSent={loadClients}
      />
    </div>
  );
};

export default DieticianDashboard;
