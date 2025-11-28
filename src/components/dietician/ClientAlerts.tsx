import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, X, User, Clock, Activity, Pill } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Alert {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar: string | null;
  alert_type: string;
  severity: string;
  message: string;
  triggered_at: string;
}

export const ClientAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAlerts();
      generateAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const { data: alertsData, error } = await supabase
        .from("client_alerts")
        .select(`
          id,
          client_id,
          alert_type,
          severity,
          message,
          triggered_at,
          profiles!client_alerts_client_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("dietician_id", user.id)
        .eq("is_dismissed", false)
        .order("triggered_at", { ascending: false });

      if (error) throw error;

      const formattedAlerts: Alert[] = (alertsData || []).map((alert: any) => ({
        id: alert.id,
        client_id: alert.client_id,
        client_name: alert.profiles.full_name || "Unknown",
        client_avatar: alert.profiles.avatar_url,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        triggered_at: alert.triggered_at,
      }));

      setAlerts(formattedAlerts);
    } catch (error: any) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    if (!user) return;

    try {
      // Get all active clients
      const { data: clients } = await supabase
        .from("dietician_clients")
        .select("client_id")
        .eq("dietician_id", user.id)
        .eq("status", "active");

      if (!clients || clients.length === 0) return;

      const newAlerts: Array<{ client_id: string; alert_type: string; severity: string; message: string }> = [];

      for (const client of clients) {
        // Check for inactivity (no events in last 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: recentEvents } = await supabase
          .from("timeline_events")
          .select("id, event_date")
          .eq("user_id", client.client_id)
          .gte("event_date", threeDaysAgo.toISOString())
          .limit(1);

        if (!recentEvents || recentEvents.length === 0) {
          // Check if we already have this alert
          const { data: existingAlert } = await supabase
            .from("client_alerts")
            .select("id")
            .eq("dietician_id", user.id)
            .eq("client_id", client.client_id)
            .eq("alert_type", "inactive")
            .eq("is_dismissed", false)
            .limit(1)
            .maybeSingle();

          if (!existingAlert) {
            newAlerts.push({
              client_id: client.client_id,
              alert_type: "inactive",
              severity: "medium",
              message: "No activity logged in the past 3 days",
            });
          }
        }

        // Check for missing weekly summary
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: recentSummary } = await supabase
          .from("weekly_summaries")
          .select("id")
          .eq("user_id", client.client_id)
          .gte("week_start_date", format(oneWeekAgo, "yyyy-MM-dd"))
          .limit(1);

        if (!recentSummary || recentSummary.length === 0) {
          const { data: existingAlert } = await supabase
            .from("client_alerts")
            .select("id")
            .eq("dietician_id", user.id)
            .eq("client_id", client.client_id)
            .eq("alert_type", "missed_checkin")
            .eq("is_dismissed", false)
            .limit(1)
            .maybeSingle();

          if (!existingAlert) {
            newAlerts.push({
              client_id: client.client_id,
              alert_type: "missed_checkin",
              severity: "low",
              message: "No weekly summary generated recently",
            });
          }
        }
      }

      // Insert new alerts
      if (newAlerts.length > 0) {
        const alertsToInsert = newAlerts.map(alert => ({
          ...alert,
          dietician_id: user.id,
        }));

        await supabase.from("client_alerts").insert(alertsToInsert);
        await loadAlerts();
      }
    } catch (error) {
      console.error("Error generating alerts:", error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("client_alerts")
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== alertId));

      toast({
        title: "Alert dismissed",
        description: "The alert has been dismissed",
      });
    } catch (error: any) {
      console.error("Error dismissing alert:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "inactive":
        return <Clock className="h-4 w-4" />;
      case "missed_checkin":
        return <Activity className="h-4 w-4" />;
      case "symptom_reported":
        return <Pill className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-orange-500 text-white";
      case "low":
        return "bg-yellow-500 text-black";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading || alerts.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            className="w-full"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {alerts.length} Client{alerts.length > 1 ? "s" : ""} Need{alerts.length === 1 ? "s" : ""} Attention
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <CardTitle>Needs Attention</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(true)}
          >
            Hide
          </Button>
        </div>
        <CardDescription>
          {alerts.length} client{alerts.length > 1 ? "s" : ""} requiring follow-up
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-4 rounded-lg bg-background border hover:shadow-md transition-shadow"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={alert.client_avatar || ""} />
              <AvatarFallback>
                {alert.client_name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{alert.client_name}</h4>
                <Badge className={getSeverityColor(alert.severity)}>
                  {getAlertIcon(alert.alert_type)}
                  <span className="ml-1 capitalize">{alert.severity}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/client/${alert.client_id}`)}
                >
                  <User className="h-3 w-3 mr-1" />
                  View Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};