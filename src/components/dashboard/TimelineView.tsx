import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Activity, Pill, AlertCircle } from "lucide-react";

interface TimelineViewProps {
  selectedDate: Date;
  events: any[];
}

// Mock data for demo
const mockEvents = [
  {
    id: 1,
    time: "08:00",
    type: "meal",
    title: "Breakfast",
    description: "1 sourdough toast with avocado, 2 scrambled eggs",
    icon: Utensils,
    color: "success",
  },
  {
    id: 2,
    time: "10:30",
    type: "medication",
    title: "Morning Medication",
    description: "Metformin 500mg",
    icon: Pill,
    color: "primary",
  },
  {
    id: 3,
    time: "18:00",
    type: "workout",
    title: "Basketball",
    description: "45 minutes, moderate intensity",
    icon: Activity,
    color: "accent",
  },
  {
    id: 4,
    time: "19:30",
    type: "symptom",
    title: "Right shoulder discomfort",
    description: "Slight pain during basketball, severity: 3/10",
    icon: AlertCircle,
    color: "warning",
  },
];

export const TimelineView = ({ selectedDate, events }: TimelineViewProps) => {
  const displayEvents = events.length > 0 ? events : mockEvents;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayEvents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No entries for this day yet. Use Quick Log to add one!
          </p>
        ) : (
          displayEvents.map((event) => (
            <TimelineEntry key={event.id} event={event} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

const TimelineEntry = ({ event }: { event: typeof mockEvents[0] }) => {
  const Icon = event.icon;
  
  return (
    <div className="flex gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full bg-${event.color}/10`}>
          <Icon className={`h-5 w-5 text-${event.color}`} />
        </div>
        <span className="text-xs text-muted-foreground mt-1">{event.time}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">{event.title}</h4>
          <Badge variant="outline" className="text-xs">
            {event.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{event.description}</p>
      </div>
    </div>
  );
};
