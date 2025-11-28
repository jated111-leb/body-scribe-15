import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Pin, PinOff, TrendingUp, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface ClientOverviewCardProps {
  clientId: string;
  clientName: string;
  clientAvatar: string | null;
  status: string;
  isPinned: boolean;
  dieticianId: string;
  onPinToggle: () => void;
}

export const ClientOverviewCard = ({
  clientId,
  clientName,
  clientAvatar,
  status,
  isPinned,
  dieticianId,
  onPinToggle,
}: ClientOverviewCardProps) => {
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      // Get last activity
      const { data: lastEvent } = await supabase
        .from("timeline_events")
        .select("event_date")
        .eq("user_id", clientId)
        .order("event_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastEvent) {
        setLastActivity(lastEvent.event_date);
      }

      // Get activity sparkline data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: events } = await supabase
        .from("timeline_events")
        .select("event_date")
        .eq("user_id", clientId)
        .gte("event_date", sevenDaysAgo.toISOString());

      // Group by day
      const eventsByDay: { [key: string]: number } = {};
      events?.forEach(event => {
        const day = format(new Date(event.event_date), "yyyy-MM-dd");
        eventsByDay[day] = (eventsByDay[day] || 0) + 1;
      });

      const sparklineData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const day = format(date, "yyyy-MM-dd");
        return { date: day, count: eventsByDay[day] || 0 };
      });

      setActivityData(sparklineData);

      // Check for alerts
      const { data: alerts } = await supabase
        .from("client_alerts")
        .select("id")
        .eq("dietician_id", dieticianId)
        .eq("client_id", clientId)
        .eq("is_dismissed", false)
        .limit(1);

      setHasAlerts((alerts?.length || 0) > 0);

      // Get current achievement streak
      const { data: achievements } = await supabase
        .from("achievements")
        .select("current_streak")
        .eq("user_id", clientId)
        .eq("status", "active")
        .order("current_streak", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (achievements) {
        setCurrentStreak(achievements.current_streak);
      }
    } catch (error) {
      console.error("Error loading client data:", error);
    }
  };

  const handleTogglePin = async () => {
    try {
      const { error } = await supabase
        .from("dietician_clients")
        .update({ is_pinned: !isPinned })
        .eq("dietician_id", dieticianId)
        .eq("client_id", clientId);

      if (error) throw error;

      onPinToggle();
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const getActivityStatus = () => {
    if (!lastActivity) return { color: "text-muted-foreground", text: "No activity" };
    
    const daysSince = differenceInDays(new Date(), new Date(lastActivity));
    
    if (daysSince === 0) return { color: "text-green-600", text: "Active today" };
    if (daysSince === 1) return { color: "text-green-500", text: "Active yesterday" };
    if (daysSince <= 3) return { color: "text-yellow-600", text: `${daysSince} days ago` };
    return { color: "text-red-600", text: `Inactive ${daysSince} days` };
  };

  const activityStatus = getActivityStatus();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer relative">
      <CardContent className="p-6" onClick={() => navigate(`/client/${clientId}`)}>
        <div className="flex items-start gap-4">
          {/* Pin Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePin();
            }}
          >
            {isPinned ? (
              <Pin className="h-4 w-4 text-primary" fill="currentColor" />
            ) : (
              <PinOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Avatar */}
          <Avatar className="h-16 w-16">
            <AvatarImage src={clientAvatar || ""} />
            <AvatarFallback>
              {clientName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Client Name & Status */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">{clientName}</h3>
              {hasAlerts && (
                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
              )}
            </div>

            {/* Activity Status */}
            <p className={`text-sm mb-3 ${activityStatus.color}`}>
              {activityStatus.text}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-3">
              {currentStreak > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {currentStreak} day streak
                </Badge>
              )}
              <Badge variant={status === "active" ? "outline" : "secondary"} className="text-xs">
                {status}
              </Badge>
            </div>

            {/* Activity Sparkline */}
            {activityData.length > 0 && (
              <div className="h-12 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Action Button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/client/${clientId}`);
              }}
            >
              View Progress
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};