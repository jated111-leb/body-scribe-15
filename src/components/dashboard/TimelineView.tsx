import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Activity, Pill, AlertCircle, FileText, User, Stethoscope, Syringe } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { getGuestEventsForRange } from "@/lib/demo";

interface TimelineViewProps {
  selectedDate: Date;
  clientId?: string; // Optional: if provided, load data for this client instead of current user
}

export const TimelineView = ({ selectedDate, clientId }: TimelineViewProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [selectedDate, user, clientId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Get start and end of selected day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      if (!user) {
        const guest = getGuestEventsForRange(startOfDay, endOfDay).map(event => ({
          ...event,
          time: format(new Date(event.event_date), 'HH:mm'),
          icon: getIconForType(event.event_type),
        }));
        setEvents(guest);
        return;
      }

      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', clientId || user.id) // Use clientId if provided, otherwise current user
        .gte('event_date', startOfDay.toISOString())
        .lte('event_date', endOfDay.toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      const formattedEvents = (data || []).map(event => ({
        ...event,
        time: format(new Date(event.event_date), 'HH:mm'),
        icon: getIconForType(event.event_type),
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "meal": return Utensils;
      case "workout": 
      case "activity": return Activity;
      case "medication": return Pill;
      case "symptom": 
      case "illness": return AlertCircle;
      case "doctor_visit": return User;
      case "injury": return Stethoscope;
      case "surgery": return Syringe;
      default: return FileText;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case "meal": return "primary";
      case "workout": 
      case "activity": return "accent";
      case "medication": return "secondary";
      case "symptom": 
      case "illness": return "destructive";
      case "injury": return "destructive";
      case "surgery": return "destructive";
      default: return "default";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline for {selectedDate.toLocaleDateString()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No entries for this day yet. Use Quick Log to add one!
          </p>
        ) : (
          events.map((event) => (
            <TimelineEntry 
              key={event.id} 
              event={event}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

const TimelineEntry = ({ event }: { event: any }) => {
  const Icon = event.icon;
  
  return (
    <div className="flex gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex flex-col items-center">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground mt-1">{event.time}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">{event.title}</h4>
          <Badge variant="outline" className="text-xs">
            {event.event_type}
          </Badge>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        {event.medication_name && (
          <p className="text-sm text-muted-foreground">
            {event.prescription_start && `Started: ${format(new Date(event.prescription_start), 'MMM d, yyyy')}`}
            {event.prescription_end && ` - Ended: ${format(new Date(event.prescription_end), 'MMM d, yyyy')}`}
          </p>
        )}
      </div>
    </div>
  );
};
