import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestEvents, TimelineEvent } from "@/lib/demo";
import { format } from "date-fns";

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const getActivityEmoji = (activityType: string): string => {
  const type = activityType.toLowerCase();
  if (type.includes('basketball')) return '🏀';
  if (type.includes('tennis')) return '🎾';
  if (type.includes('yoga')) return '🧘🏽‍♂️';
  if (type.includes('pt') || type.includes('training')) return '🏋🏽';
  if (type.includes('medication')) return '💊';
  if (type.includes('surgery')) return '🏥';
  if (type.includes('injury')) return '🤕';
  if (type.includes('illness') || type.includes('inflammation')) return '🤒';
  return '📝';
};

export const CalendarView = ({ selectedDate, onSelectDate }: CalendarViewProps) => {
  const [eventsByDate, setEventsByDate] = useState<Map<string, TimelineEvent[]>>(new Map());
  const [alcoholFreeDate] = useState<Date>(new Date(2025, 8, 12)); // September 12, 2025
  const { user } = useAuth();

  useEffect(() => {
    loadEventDates();
  }, [user]);

  const loadEventDates = async () => {
    if (!user) {
      const guestEvents = getGuestEvents();
      const eventsMap = new Map<string, TimelineEvent[]>();
      
      guestEvents.forEach(event => {
        const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
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
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading event dates:', error);
      return;
    }

    const eventsMap = new Map<string, TimelineEvent[]>();
    data.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)?.push(event as TimelineEvent);
    });
    
    setEventsByDate(eventsMap);
  };

  const renderDayContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const alcoholFreeDateKey = format(alcoholFreeDate, 'yyyy-MM-dd');
    const events = eventsByDate.get(dateKey) || [];
    
    // Get unique activity emojis for this date
    const emojis = events
      .map(event => {
        if (event.event_type === 'workout' && event.activity_type) {
          return getActivityEmoji(event.activity_type);
        }
        return getActivityEmoji(event.event_type);
      })
      .filter((emoji, index, self) => self.indexOf(emoji) === index)
      .slice(0, 3); // Limit to 3 emojis max

    const isAlcoholFreeDay = dateKey === alcoholFreeDateKey;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{date.getDate()}</span>
        {(emojis.length > 0 || isAlcoholFreeDay) && (
          <div className="absolute top-0 right-0 flex gap-0.5 text-[10px] leading-none">
            {isAlcoholFreeDay && <span>🚫</span>}
            {emojis.map((emoji, idx) => (
              <span key={idx}>{emoji}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          className="rounded-md"
          components={{
            DayContent: ({ date }) => renderDayContent(date)
          }}
        />
      </CardContent>
    </Card>
  );
};
