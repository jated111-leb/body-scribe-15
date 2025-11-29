import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfDay, isSameDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_EMOJIS } from "@/lib/iconEmojis";

const EVENT_TYPES = [
  { value: "meal", label: "Meals", emoji: EVENT_EMOJIS.meal },
  { value: "workout", label: "Workouts", emoji: EVENT_EMOJIS.workout },
  { value: "medication", label: "Medications", emoji: EVENT_EMOJIS.medication },
  { value: "symptom", label: "Symptoms", emoji: EVENT_EMOJIS.symptom },
  { value: "doctor_visit", label: "Doctor Visits", emoji: EVENT_EMOJIS.doctor_visit },
  { value: "injury", label: "Injuries", emoji: EVENT_EMOJIS.injury },
  { value: "note", label: "Notes", emoji: EVENT_EMOJIS.note },
  { value: "moment", label: "Moments", emoji: EVENT_EMOJIS.moment },
];

interface GroupedEvents {
  date: Date;
  events: any[];
}

export const TimelineFeed = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [user]);

  // Realtime updates: refresh feed when new events are added/updated/deleted
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('timeline-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_events',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmojiForType = (type: string): string => {
    const typeConfig = EVENT_TYPES.find(t => t.value === type);
    return typeConfig?.emoji || EVENT_EMOJIS.note;
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case "meal": return "bg-primary/10 text-primary border-primary/20";
      case "workout": 
      case "activity": return "bg-accent/10 text-accent border-accent/20";
      case "medication": return "bg-secondary/10 text-secondary border-secondary/20";
      case "symptom": 
      case "illness": 
      case "injury": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const toggleFilter = (type: string) => {
    setSelectedFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const filteredEvents = selectedFilters.length > 0
    ? events.filter(event => selectedFilters.includes(event.event_type))
    : events;

  // Group events by date
  const groupedEvents: GroupedEvents[] = filteredEvents.reduce((acc: GroupedEvents[], event) => {
    const eventDate = startOfDay(new Date(event.event_date));
    const existingGroup = acc.find(group => isSameDay(group.date, eventDate));
    
    if (existingGroup) {
      existingGroup.events.push(event);
    } else {
      acc.push({ date: eventDate, events: [event] });
    }
    
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Type
            </CardTitle>
            {selectedFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(type => {
              const isSelected = selectedFilters.includes(type.value);
              return (
                <Button
                  key={type.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(type.value)}
                  className="gap-2"
                >
                  <span className="text-lg">{type.emoji}</span>
                  {type.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Feed */}
      {groupedEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No entries found</h3>
            <p className="text-muted-foreground">
              {selectedFilters.length > 0 
                ? "Try adjusting your filters or log a new entry"
                : "Start tracking your health by logging your first entry"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map(({ date, events }) => (
            <Card key={date.toISOString()} className="overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  {format(date, 'EEEE, MMMM d, yyyy')}
                  <Badge variant="outline" className="ml-auto">
                    {events.length} {events.length === 1 ? 'entry' : 'entries'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {events.map((event) => {
                    const emoji = getEmojiForType(event.event_type);
                    const colorClass = getColorForType(event.event_type);
                    
                    return (
                      <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex gap-4">
                          {/* Time & Icon */}
                          <div className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className={`p-2 rounded-lg border ${colorClass} text-2xl`}>
                              {emoji}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {format(new Date(event.event_date), 'HH:mm')}
                            </span>
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                <Badge variant="outline" className="mt-1">
                                  {event.event_type.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            {event.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {event.description}
                              </p>
                            )}

                            {/* Event-specific details */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {event.calories && (
                                <span className="text-muted-foreground">
                                  🔥 {event.calories} kcal
                                </span>
                              )}
                              {event.duration && (
                                <span className="text-muted-foreground">
                                  ⏱️ {event.duration} min
                                </span>
                              )}
                              {event.intensity && (
                                <span className="text-muted-foreground">
                                  💪 {event.intensity}
                                </span>
                              )}
                              {event.severity && (
                                <span className="text-muted-foreground">
                                  ⚠️ {event.severity}
                                </span>
                              )}
                              {event.dosage && (
                                <span className="text-muted-foreground">
                                  💊 {event.dosage}
                                </span>
                              )}
                            </div>

                            {/* Images */}
                            {event.attachment_urls && event.attachment_urls.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                {event.attachment_urls.map((url: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`Attachment ${idx + 1}`}
                                    className="rounded-lg border object-cover aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
