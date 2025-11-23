import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestEvents, TimelineEvent } from "@/lib/demo";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  clientId?: string;
}

export type StoryDay = {
  date: string; // ISO date, e.g. "2025-10-07"
  thumbnailUrl: string;
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
  const [storyDays, setStoryDays] = useState<Map<string, StoryDay>>(new Map());
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
      const stories = new Map<string, StoryDay>();
      
      guestEvents.forEach(event => {
        const dateKey = toLocalDateKey(event.event_date);
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, []);
        }
        eventsMap.get(dateKey)?.push(event);
        
        // Create story day with thumbnail if event has attachments
        if (event.attachment_urls && event.attachment_urls.length > 0) {
          stories.set(dateKey, {
            date: dateKey,
            thumbnailUrl: event.attachment_urls[0]
          });
        }
      });
      
      setEventsByDate(eventsMap);
      setStoryDays(stories);
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
    const stories = new Map<string, StoryDay>();
    
    data.forEach(event => {
      const dateKey = toLocalDateKey(event.event_date);
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)?.push(event as TimelineEvent);
      
      // Create story day with thumbnail if event has attachments
      if (event.attachment_urls && event.attachment_urls.length > 0) {
        stories.set(dateKey, {
          date: dateKey,
          thumbnailUrl: event.attachment_urls[0]
        });
      }
    });
    
    setEventsByDate(eventsMap);
    setStoryDays(stories);
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
            const storyDay = storyDays.get(dateKey);
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <button
                key={dateKey}
                onClick={() => handleDayClick(day, dateKey)}
                className={`
                  aspect-square rounded-full flex items-center justify-center relative
                  transition-all duration-200
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  ${storyDay ? 'p-0' : 'hover:bg-accent'}
                `}
              >
                {storyDay ? (
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img 
                      src={storyDay.thumbnailUrl} 
                      alt={`Story from ${dateKey}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-white font-semibold text-sm drop-shadow-lg">
                        {day.getDate()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {day.getDate()}
                  </span>
                )}
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
          
          <div className="mt-6 space-y-4">
            {selectedDayStories?.map((story) => (
              <div key={story.id} className="flex gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                {story.attachment_urls && story.attachment_urls.length > 0 && (
                  <img 
                    src={story.attachment_urls[0]} 
                    alt={story.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-foreground">{story.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(story.created_at || story.event_date), 'h:mm a')}
                    </span>
                  </div>
                  {story.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {story.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {story.event_type}
                    </span>
                    {story.meal_type && (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                        {story.meal_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
