import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Sparkles, StickyNote, TrendingUp, Utensils, Activity, Pill, Flag, Calendar } from "lucide-react";
import { format } from "date-fns";
import { SummaryNotePanel } from "./SummaryNotePanel";

interface ClientSummary {
  client_id: string;
  client_name: string;
  client_avatar: string | null;
  summary_id: string | null;
  week_start_date: string | null;
  week_end_date: string | null;
  summary_text: string | null;
  total_events: number;
  meal_count: number;
  workout_count: number;
  medication_count: number;
  note_count: number;
  has_flagged_note: boolean;
}

export const ClientSummariesView = () => {
  const [summaries, setSummaries] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedSummary, setSelectedSummary] = useState<ClientSummary | null>(null);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadClientSummaries();
    }
  }, [user]);

  const loadClientSummaries = async () => {
    if (!user) return;

    try {
      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from("dietician_clients")
        .select(`
          client_id,
          profiles!dietician_clients_client_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("dietician_id", user.id)
        .eq("status", "active");

      if (clientsError) throw clientsError;

      // Get latest summaries for each client
      const summariesPromises = clients?.map(async (client: any) => {
        // Get latest summary
        const { data: summary } = await supabase
          .from("weekly_summaries")
          .select("*")
          .eq("user_id", client.client_id)
          .order("week_start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get note count
        const { count: noteCount } = await supabase
          .from("dietician_notes")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.client_id)
          .eq("dietician_id", user.id);

        // Check for flagged notes
        const { data: flaggedNotes } = await supabase
          .from("dietician_notes")
          .select("is_flagged")
          .eq("client_id", client.client_id)
          .eq("dietician_id", user.id)
          .eq("is_flagged", true)
          .limit(1)
          .maybeSingle();

        return {
          client_id: client.client_id,
          client_name: client.profiles.full_name || "Unknown",
          client_avatar: client.profiles.avatar_url,
          summary_id: summary?.id || null,
          week_start_date: summary?.week_start_date || null,
          week_end_date: summary?.week_end_date || null,
          summary_text: summary?.summary_text || null,
          total_events: summary?.total_events || 0,
          meal_count: summary?.meal_count || 0,
          workout_count: summary?.workout_count || 0,
          medication_count: summary?.medication_count || 0,
          note_count: noteCount || 0,
          has_flagged_note: !!flaggedNotes,
        };
      }) || [];

      const summariesData = await Promise.all(summariesPromises);
      setSummaries(summariesData);
    } catch (error: any) {
      console.error("Error loading client summaries:", error);
      toast({
        title: "Error",
        description: "Failed to load client summaries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSummaries = summaries
    .filter((summary) => {
      // Search filter
      if (searchQuery && !summary.client_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filterBy === "has_summary" && !summary.summary_id) return false;
      if (filterBy === "no_summary" && summary.summary_id) return false;
      if (filterBy === "flagged" && !summary.has_flagged_note) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.client_name.localeCompare(b.client_name);
        case "activity":
          return b.total_events - a.total_events;
        case "recent":
          if (!a.week_start_date) return 1;
          if (!b.week_start_date) return -1;
          return new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime();
        default:
          return 0;
      }
    });

  const handleOpenNotePanel = (summary: ClientSummary) => {
    setSelectedSummary(summary);
    setShowNotePanel(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="has_summary">Has Summary</SelectItem>
            <SelectItem value="no_summary">No Summary</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="activity">Activity Level</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summaries Grid */}
      {filteredAndSortedSummaries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No clients found matching your search" : "No client summaries available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedSummaries.map((summary) => (
            <Card key={summary.client_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={summary.client_avatar || ""} />
                    <AvatarFallback>
                      {summary.client_name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{summary.client_name}</h3>
                      {summary.has_flagged_note && (
                        <Flag className="h-4 w-4 text-destructive" fill="currentColor" />
                      )}
                      {summary.note_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <StickyNote className="h-3 w-3 mr-1" />
                          {summary.note_count}
                        </Badge>
                      )}
                    </div>

                    {summary.summary_id ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(summary.week_start_date!), "MMM d")} - {format(new Date(summary.week_end_date!), "MMM d, yyyy")}
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingUp className="h-3 w-3 text-primary" />
                              <span className="text-xs text-muted-foreground">Events</span>
                            </div>
                            <div className="text-lg font-bold">{summary.total_events}</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Utensils className="h-3 w-3 text-primary" />
                              <span className="text-xs text-muted-foreground">Meals</span>
                            </div>
                            <div className="text-lg font-bold">{summary.meal_count}</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Activity className="h-3 w-3 text-primary" />
                              <span className="text-xs text-muted-foreground">Workouts</span>
                            </div>
                            <div className="text-lg font-bold">{summary.workout_count}</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Pill className="h-3 w-3 text-primary" />
                              <span className="text-xs text-muted-foreground">Meds</span>
                            </div>
                            <div className="text-lg font-bold">{summary.medication_count}</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 mb-4 border border-primary/20">
                          <p className="text-sm line-clamp-3">{summary.summary_text}</p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-muted/30 rounded-lg p-4 mb-4 text-center">
                        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No weekly summary generated yet</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenNotePanel(summary)}
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        {summary.note_count > 0 ? "View Notes" : "Add Note"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/${summary.client_id}`)}
                      >
                        View Full Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Panel */}
      {selectedSummary && (
        <SummaryNotePanel
          open={showNotePanel}
          onOpenChange={setShowNotePanel}
          clientId={selectedSummary.client_id}
          clientName={selectedSummary.client_name}
          summaryId={selectedSummary.summary_id}
          onNotesUpdated={loadClientSummaries}
        />
      )}
    </div>
  );
};