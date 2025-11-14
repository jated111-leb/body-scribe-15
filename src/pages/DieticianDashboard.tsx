import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Search, UserPlus, Users, TrendingUp } from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  status: string;
  last_activity?: string;
}

const DieticianDashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;

    try {
      // Get dietician's clients
      const { data: relationships, error: relError } = await supabase
        .from("dietician_clients")
        .select("client_id, status")
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

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClients = filteredClients.filter(c => c.status === "active");
  const inactiveClients = filteredClients.filter(c => c.status === "inactive");

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
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Client */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-gradient-primary shadow-glow">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Clients List */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active ({activeClients.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveClients.length})</TabsTrigger>
            <TabsTrigger value="all">All ({clients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading clients...</p>
            ) : activeClients.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No active clients yet</p>
                  <Button>Add Your First Client</Button>
                </CardContent>
              </Card>
            ) : (
              activeClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar_url || ""} />
                      <AvatarFallback>
                        {client.full_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{client.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Last activity: Today</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                    <Button variant="outline" size="sm">
                      View Progress
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4 mt-6">
            {inactiveClients.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No inactive clients
                </CardContent>
              </Card>
            ) : (
              inactiveClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer opacity-70">
                  <CardContent className="flex items-center gap-4 p-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar_url || ""} />
                      <AvatarFallback>
                        {client.full_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{client.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                    </div>
                    <Badge variant="secondary">Inactive</Badge>
                    <Button variant="outline" size="sm">
                      Reactivate
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {filteredClients.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No clients found
                </CardContent>
              </Card>
            ) : (
              filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar_url || ""} />
                      <AvatarFallback>
                        {client.full_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{client.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {client.status === "active" ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <Badge variant={client.status === "active" ? "outline" : "secondary"}>
                      {client.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Progress
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DieticianDashboard;
