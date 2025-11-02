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
  const [doctorVisitDates, setDoctorVisitDates] = useState<Date[]>([]);
  const [alcoholFreeDate] = useState<Date>(new Date(2025, 8, 12)); // September 12, 2025
  const { user } = useAuth();

  useEffect(() => {
    loadEventDates();
  }, [user]);

  const loadEventDates = async () => {
    if (!user) {
      const guestEvents = getGuestEvents();
      const eventsMap = new Map<string, TimelineEvent[]>();
      const doctorDates: Date[] = [];
      
      guestEvents.forEach(event => {
        const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, []);
        }
        eventsMap.get(dateKey)?.push(event);
        
        // Check if it's a doctor visit or ER visit (illness type with ER/doctor/visit keywords)
        if (event.event_type === 'illness' || event.event_type === 'doctor_visit' || 
            event.title?.toLowerCase().includes('doctor') || 
            event.title?.toLowerCase().includes('er') ||
            event.title?.toLowerCase().includes('visit')) {
          doctorDates.push(new Date(event.event_date));
        }
      });
      
      setEventsByDate(eventsMap);
      setDoctorVisitDates(doctorDates);
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
    const doctorDates: Date[] = [];
    
    data.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)?.push(event as TimelineEvent);
      
      // Check if it's a doctor visit or ER visit
      if (event.event_type === 'illness' || event.event_type === 'doctor_visit' ||
          event.title?.toLowerCase().includes('doctor') ||
          event.title?.toLowerCase().includes('er') ||
          event.title?.toLowerCase().includes('visit')) {
        doctorDates.push(new Date(event.event_date));
      }
    });
    
    setEventsByDate(eventsMap);
    setDoctorVisitDates(doctorDates);
  };

  const renderDayContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const alcoholFreeDateKey = format(alcoholFreeDate, 'yyyy-MM-dd');
    const events = eventsByDate.get(dateKey) || [];
    
    // Check if this date falls within any medication's prescription period
    const allEvents = Array.from(eventsByDate.values()).flat();
    const medicationsOnThisDay = allEvents.filter(event => {
      if (event.event_type === 'medication' && event.prescription_start && event.prescription_end) {
        // Only show if the current date is within the prescription range
        const start = event.prescription_start;
        const end = event.prescription_end;
        return dateKey >= start && dateKey <= end;
      }
      return false;
    });
    
    // Combine events from this specific day with medications that span this day
    // Filter out medications from events to avoid duplication
    const nonMedicationEvents = events.filter(e => e.event_type !== 'medication' || !e.prescription_start);
    const allDayEvents = [...nonMedicationEvents, ...medicationsOnThisDay];
    
    // Get unique activity emojis for this date
    const emojis = allDayEvents
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
          modifiers={{
            doctorVisit: doctorVisitDates,
          }}
          modifiersClassNames={{
            doctorVisit: "bg-blue-100 dark:bg-blue-950/30",
          }}
          components={{
            DayContent: ({ date }) => renderDayContent(date)
          }}
        />
      </CardContent>
    </Card>
  );
};
