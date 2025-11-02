import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestEvents } from "@/lib/demo";

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarView = ({ selectedDate, onSelectDate }: CalendarViewProps) => {
  const [eventDates, setEventDates] = useState<Date[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [alcoholFreeDate, setAlcoholFreeDate] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadEventDates();
  }, [user]);

  const loadEventDates = async () => {
    if (!user) {
      const guestEvents = getGuestEvents();
      const allDates = guestEvents.map(e => new Date(e.event_date));
      const workouts = guestEvents
        .filter(e => e.event_type === 'workout')
        .map(e => new Date(e.event_date));
      
      setEventDates(allDates);
      setWorkoutDates(workouts);
      setAlcoholFreeDate(new Date(2025, 8, 12)); // September 12, 2025
      return;
    }

    const { data, error } = await supabase
      .from('timeline_events')
      .select('event_date, event_type')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading event dates:', error);
      return;
    }

    const dates = data.map(event => new Date(event.event_date));
    const workouts = data
      .filter(event => event.event_type === 'workout')
      .map(event => new Date(event.event_date));
    
    setEventDates(dates);
    setWorkoutDates(workouts);
    setAlcoholFreeDate(new Date(2025, 8, 12)); // September 12, 2025
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
            hasEvent: eventDates,
            workout: workoutDates,
            alcoholFree: alcoholFreeDate ? [alcoholFreeDate] : [],
          }}
          modifiersClassNames={{
            hasEvent: "bg-primary/10 font-bold",
            workout: "!bg-red-100 dark:!bg-red-950/30 font-bold",
            alcoholFree: "!bg-yellow-100 dark:!bg-yellow-950/30 font-bold",
          }}
        />
      </CardContent>
    </Card>
  );
};
