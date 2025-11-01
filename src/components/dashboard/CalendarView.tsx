import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarView = ({ selectedDate, onSelectDate }: CalendarViewProps) => {
  const [eventDates, setEventDates] = useState<Date[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadEventDates();
  }, [user]);

  const loadEventDates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('timeline_events')
      .select('event_date')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading event dates:', error);
      return;
    }

    const dates = data.map(event => new Date(event.event_date));
    setEventDates(dates);
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
          }}
          modifiersClassNames={{
            hasEvent: "bg-primary/10 font-bold",
          }}
        />
      </CardContent>
    </Card>
  );
};
