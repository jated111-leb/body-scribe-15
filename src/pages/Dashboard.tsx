import { useState } from "react";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { ChatSidebar } from "@/components/dashboard/ChatSidebar";
import { QuickLogDialog } from "@/components/dashboard/QuickLogDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showQuickLog, setShowQuickLog] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Calendar + Timeline */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Your Health Timeline</h1>
                <p className="text-muted-foreground">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <Button 
                className="bg-gradient-primary shadow-glow"
                onClick={() => setShowQuickLog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Quick Log
              </Button>
            </div>

            {/* Calendar */}
            <CalendarView 
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Timeline for selected day */}
            <TimelineView selectedDate={selectedDate} />
          </div>
        </div>

        {/* Right: Chat Assistant */}
        <ChatSidebar />
      </div>

      {/* Quick Log Dialog */}
      <QuickLogDialog 
        open={showQuickLog}
        onOpenChange={setShowQuickLog}
      />
    </div>
  );
};

export default Dashboard;
