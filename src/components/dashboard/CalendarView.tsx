import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestEvents, TimelineEvent } from "@/lib/demo";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Utensils, Moon, Pill, Zap, Activity, Brain, StickyNote } from "lucide-react";

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  clientId?: string;
}

export type StoryDay = {
  date: string; // ISO date, e.g. "2025-10-07"
  thumbnailUrl: string;
};

type CategoryConfig = {
  icon: React.ReactNode;
  label: string;
  color: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  meal: { icon: <Utensils className="w-3 h-3" />, label: "Meals", color: "bg-orange-500" },
  sleep: { icon: <Moon className="w-3 h-3" />, label: "Sleep", color: "bg-indigo-500" },
  medication: { icon: <Pill className="w-3 h-3" />, label: "Supplements", color: "bg-green-500" },
  workout: { icon: <Zap className="w-3 h-3" />, label: "Activity", color: "bg-yellow-500" },
  injury: { icon: <Activity className="w-3 h-3" />, label: "Symptoms", color: "bg-red-500" },
  mood: { icon: <Brain className="w-3 h-3" />, label: "Mood", color: "bg-purple-500" },
  doctor_visit: { icon: <StickyNote className="w-3 h-3" />, label: "Notes", color: "bg-blue-500" },
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
  const [eventsByDate, setEventsByDate] = useState<Map<string, TimelineEvent[]>>(new Map());
  const [selectedDayStories, setSelectedDayStories] = useState<TimelineEvent[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { user } = useAuth();
  const [monthsToShow] = useState(6); // Show 6 months

  useEffect(() => {
    loadEventDates();
  }, [user, clientId]);

  const loadEventDates = async () => {
    if (!user) {
      const guestEvents = getGuestEvents();
      const eventsMap = new Map<string, TimelineEvent[]>();
      
      guestEvents.forEach(event => {
        const dateKey = toLocalDateKey(event.event_date);
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, []);
        }
        eventsMap.get(dateKey)?.push(event);
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

    const eventsMap = new Map<string, TimelineEvent[]>();
    
    data.forEach(event => {
      const dateKey = toLocalDateKey(event.event_date);
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)?.push(event as TimelineEvent);
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
    
    // Get first day of month to calculate offset
    const firstDayOfWeek = monthStart.getDay();
    const emptyDays = Array(firstDayOfWeek).fill(null);
    
    return (
      <div key={monthOffset} className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
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
                  aspect-square rounded-lg flex flex-col items-center justify-center relative
                  transition-all duration-200
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  ${hasEvents ? 'hover:bg-accent/50' : 'hover:bg-accent'}
                `}
              >
                <span className={`text-sm ${hasEvents ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {day.getDate()}
                </span>
                
                {/* Photo thumbnail + Category icon badges */}
                {hasEvents && (() => {
                  // Collect all photos from all events on this day
                  const allPhotos = events.flatMap(e => e.attachment_urls || []);
                  const firstPhoto = allPhotos[0];
                  const totalPhotoCount = allPhotos.length;
                  
                  return (
                    <div className="flex flex-col items-center gap-1 mt-1">
                      {/* First photo with count badge if photos exist */}
                      {firstPhoto && (
                        <div className="relative">
                          <img 
                            src={firstPhoto} 
                            alt="Event" 
                            className="w-8 h-8 rounded object-cover"
                          />
                          {totalPhotoCount > 1 && (
                            <span className="absolute -bottom-1 -right-1 bg-black/70 text-white text-[8px] px-1 rounded-full leading-tight">
                              +{totalPhotoCount - 1}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Category icons */}
                      <div className="flex gap-0.5">
                        {categories.slice(0, 3).map((eventType) => {
                          const config = CATEGORY_MAP[eventType];
                          if (!config) return null;
                          return (
                            <div 
                              key={eventType}
                              className={`${config.color} rounded-full p-0.5 text-white`}
                            >
                              {config.icon}
                            </div>
                          );
                        })}
                        {categories.length > 3 && (
                          <div className="bg-muted rounded-full w-3 h-3 flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground">+</span>
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
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] px-4 py-2">
        {Array.from({ length: monthsToShow }, (_, i) => renderMonth(i))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDayStories && selectedDayStories.length > 0 
                ? format(new Date(selectedDayStories[0].event_date), 'MMMM d, yyyy')
                : 'Stories'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {selectedDayStories && (() => {
              // Group events by category
              const grouped = selectedDayStories.reduce((acc, event) => {
                const type = event.event_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(event);
                return acc;
              }, {} as Record<string, TimelineEvent[]>);

              return Object.entries(grouped).map(([eventType, events]) => {
                const config = CATEGORY_MAP[eventType];
                if (!config) return null;

                // Get all photos from all events in this category
                const allPhotos = events.flatMap(e => e.attachment_urls || []);
                const firstPhoto = allPhotos[0];
                const photoCount = allPhotos.length;

                return (
                  <div key={eventType} className="border border-border rounded-lg p-4">
                    {/* Category header with first photo + badge */}
                    <div className="flex items-center gap-3 mb-3">
                      {firstPhoto && (
                        <div className="flex items-center gap-2">
                          <img 
                            src={firstPhoto} 
                            alt={config.label}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          {photoCount > 1 && (
                            <span className="text-sm font-semibold text-muted-foreground">
                              +{photoCount - 1}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className={`${config.color} rounded-full p-1.5 text-white`}>
                          {config.icon}
                        </div>
                        <h4 className="font-semibold text-foreground">{config.label}</h4>
                      </div>
                    </div>

                    {/* Event list */}
                    <div className="space-y-2 ml-1">
                      {events.map((event) => (
                        <div key={event.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground">{event.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at || event.event_date), 'h:mm a')}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-muted-foreground line-clamp-1 mt-0.5">
                              {event.description}
                            </p>
                          )}
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
