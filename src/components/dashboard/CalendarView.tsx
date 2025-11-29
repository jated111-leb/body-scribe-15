import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestEvents } from "@/lib/demo";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EVENT_EMOJIS } from "@/lib/iconEmojis";

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  clientId?: string;
}

export type StoryDay = {
  date: string; // ISO date, e.g. "2025-10-07"
  thumbnailUrl: string;
};

// Extended timeline event type with all database fields
interface ExtendedTimelineEvent {
  id: string;
  user_id?: string | null;
  event_type: string;
  title: string;
  event_date: string;
  description?: string | null;
  medication_name?: string | null;
  prescription_start?: string | null;
  prescription_end?: string | null;
  severity?: string | null;
  activity_type?: string | null;
  duration?: number | null;
  intensity?: string | null;
  dosage?: string | null;
  attachment_urls?: string[] | null;
  created_at?: string | null;
  meal_type?: string | null;
}

type CategoryConfig = {
  emoji: string;
  label: string;
  color: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  meal: { emoji: EVENT_EMOJIS.meal, label: "Meals", color: "bg-health" },
  workout: { emoji: EVENT_EMOJIS.workout, label: "Workouts", color: "bg-health" },
  medication: { emoji: EVENT_EMOJIS.medication, label: "Medications", color: "bg-health" },
  symptom: { emoji: EVENT_EMOJIS.symptom, label: "Symptoms", color: "bg-destructive" },
  doctor_visit: { emoji: EVENT_EMOJIS.doctor_visit, label: "Doctor Visits", color: "bg-health" },
  injury: { emoji: EVENT_EMOJIS.injury, label: "Injuries", color: "bg-destructive" },
  note: { emoji: EVENT_EMOJIS.note, label: "Notes", color: "bg-health" },
  moment: { emoji: EVENT_EMOJIS.moment, label: "Moments", color: "bg-health" },
  sleep: { emoji: EVENT_EMOJIS.sleep, label: "Sleep", color: "bg-health" },
  mood: { emoji: EVENT_EMOJIS.mood, label: "Mood", color: "bg-health" },
  vitals: { emoji: EVENT_EMOJIS.vitals, label: "Vitals", color: "bg-health" },
  water: { emoji: EVENT_EMOJIS.water, label: "Water", color: "bg-health" },
};

// Normalize to local YYYY-MM-DD to avoid timezone shifts
const toLocalDateKey = (input: string | Date): string => {
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA');
};

export const CalendarView = ({ selectedDate, onSelectDate, clientId }: CalendarViewProps) => {
  const [eventsByDate, setEventsByDate] = useState<Map<string, ExtendedTimelineEvent[]>>(new Map());
  const [selectedDayStories, setSelectedDayStories] = useState<ExtendedTimelineEvent[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { user } = useAuth();
  const [monthsToShow] = useState(6); // Show 6 months

  useEffect(() => {
    loadEventDates();
  }, [user, clientId]);

  // Realtime subscription to refresh calendar when events change
  useEffect(() => {
    if (!user) return;

    const targetUserId = clientId || user.id;
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_events',
          filter: `user_id=eq.${targetUserId}`,
        },
        () => {
          loadEventDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clientId]);

  const loadEventDates = async () => {
    if (!user) {
      const guestEvents = getGuestEvents();
      const eventsMap = new Map<string, ExtendedTimelineEvent[]>();
      
      guestEvents.forEach(event => {
        const dateKey = toLocalDateKey(event.event_date);
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, []);
        }
        eventsMap.get(dateKey)?.push(event as ExtendedTimelineEvent);
      });
      
      setEventsByDate(eventsMap);
      return;
    }

    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('user_id', clientId || user.id);

    if (error) {
      console.error('Error loading event dates:', error);
      return;
    }

    const eventsMap = new Map<string, ExtendedTimelineEvent[]>();
    
    data.forEach(event => {
      const dateKey = toLocalDateKey(event.event_date);
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)?.push(event as ExtendedTimelineEvent);
    });
    
    setEventsByDate(eventsMap);
  };

  const handleDayClick = (date: Date, dateKey: string) => {
    const events = eventsByDate.get(dateKey);
    if (events && events.length > 0) {
      setSelectedDayStories(events);
      setSheetOpen(true);
    }
    onSelectDate(date);
  };

  const renderMonth = (monthOffset: number) => {
    const currentMonth = addMonths(new Date(), monthOffset);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get first day of month to calculate offset (0 = Sunday, 1 = Monday, etc.)
    // Adjust so Monday = 0, Sunday = 6
    const firstDayOfWeek = monthStart.getDay();
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const emptyDays = Array(adjustedFirstDay).fill(null);
    
    return (
      <div key={monthOffset} className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        {/* Weekday headers - Start on Monday */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const events = eventsByDate.get(dateKey);
            const isSelected = isSameDay(day, selectedDate);
            const hasEvents = events && events.length > 0;
            
            // Get unique categories for this day
            const categories = hasEvents 
              ? Array.from(new Set(events.map(e => e.event_type)))
              : [];
            
            return (
              <button
                key={dateKey}
                onClick={() => handleDayClick(day, dateKey)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-start p-4 relative
                  bg-card-bg border border-card-border
                  transition-all duration-200
                  hover:shadow-md hover:scale-105
                  ${isSelected ? 'shadow-[0_0_0_3px_hsl(var(--health-primary-glow))] animate-soft-pulse' : ''}
                  ${hasEvents ? 'hover:border-health/30' : ''}
                `}
              >
                <span className={`text-base ${hasEvents ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {day.getDate()}
                </span>
                
                {/* Photo thumbnail + Category icon chips */}
                {hasEvents && (() => {
                  // Collect all photos from all events on this day
                  const allPhotos = events.flatMap(e => e.attachment_urls || []);
                  const firstPhoto = allPhotos[0];
                  const totalPhotoCount = allPhotos.length;
                  
                  return (
                    <div className="flex flex-col items-center gap-2 mt-2 w-full">
                      {/* First photo with count badge if photos exist */}
                      {firstPhoto && (
                        <div className="relative group">
                          <img 
                            src={firstPhoto} 
                            alt="Event" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-card-border group-hover:border-health/50 transition-all duration-200"
                          />
                          {totalPhotoCount > 1 && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-health text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                              +{totalPhotoCount - 1}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Category icon chips - emojis */}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {categories.slice(0, 4).map((eventType) => {
                          const config = CATEGORY_MAP[eventType];
                          if (!config) return null;
                          return (
                            <div 
                              key={eventType}
                              className="bg-muted/50 rounded-md p-1 text-lg"
                              title={config.label}
                            >
                              {config.emoji}
                            </div>
                          );
                        })}
                        {categories.length > 4 && (
                          <div className="bg-muted/50 rounded-md px-1.5 py-1 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-muted-foreground">+{categories.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] px-4 py-6">
        {Array.from({ length: monthsToShow }, (_, i) => renderMonth(i))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] bg-background/95 backdrop-blur-sm">
          <SheetHeader className="pb-6 border-b border-border/50">
            <SheetTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {selectedDayStories && selectedDayStories.length > 0 
                ? format(new Date(selectedDayStories[0].event_date), 'EEEE, MMMM d, yyyy')
                : 'Your Day'}
            </SheetTitle>
            {selectedDayStories && selectedDayStories.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedDayStories.length} {selectedDayStories.length === 1 ? 'entry' : 'entries'} logged
              </p>
            )}
          </SheetHeader>
          
          <div className="mt-6 overflow-y-auto max-h-[calc(85vh-8rem)] space-y-4 px-1">
            {selectedDayStories && (() => {
              // Group events by category
              const grouped = selectedDayStories.reduce((acc, event) => {
                const type = event.event_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(event);
                return acc;
              }, {} as Record<string, ExtendedTimelineEvent[]>);

              return Object.entries(grouped).map(([eventType, events]) => {
                const config = CATEGORY_MAP[eventType];
                if (!config) return null;

                // Get all photos from all events in this category
                const allPhotos = events.flatMap(e => e.attachment_urls || []);

                return (
                  <div 
                    key={eventType} 
                    className="group border border-border/50 rounded-xl p-5 bg-card hover:border-health/30 hover:shadow-md transition-all duration-200"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-gradient-primary text-white shadow-sm group-hover:shadow-md transition-shadow text-xl">
                        {config.emoji}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{config.label}</h4>
                        <p className="text-xs text-muted-foreground">
                          {events.length} {events.length === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                    </div>

                    {/* Photo gallery if photos exist */}
                    {allPhotos.length > 0 && (
                      <div className={`mb-4 grid gap-2 ${
                        allPhotos.length === 1 ? 'grid-cols-1' : 
                        allPhotos.length === 2 ? 'grid-cols-2' : 
                        'grid-cols-3'
                      }`}>
                        {allPhotos.slice(0, 6).map((photo, idx) => (
                          <a
                            key={idx}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:scale-105 transition-transform duration-200 shadow-sm"
                          >
                            <img 
                              src={photo} 
                              alt={`${config.label} ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                        {allPhotos.length > 6 && (
                          <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                            <span className="text-sm font-medium text-muted-foreground">
                              +{allPhotos.length - 6}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Event timeline */}
                    <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-health/20 before:to-transparent">
                      {events.map((event, idx) => (
                        <div key={event.id} className="flex gap-3 relative pl-5">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-health/20 border-2 border-health shadow-sm" />
                          
                          <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className="font-medium text-foreground leading-tight">{event.title}</h5>
                              <time className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                                {format(new Date(event.created_at || event.event_date), 'h:mm a')}
                              </time>
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                                {event.description}
                              </p>
                            )}
                            
                            {/* Additional metadata for specific event types */}
                            {eventType === 'workout' && (event.duration || event.intensity) && (
                              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                {event.duration && (
                                  <span className="px-2 py-1 bg-muted rounded-md">
                                    ⏱ {event.duration} min
                                  </span>
                                )}
                                {event.intensity && (
                                  <span className="px-2 py-1 bg-muted rounded-md capitalize">
                                    💪 {event.intensity}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {eventType === 'medication' && event.dosage && (
                              <p className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted rounded-md inline-block">
                                💊 {event.dosage}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
