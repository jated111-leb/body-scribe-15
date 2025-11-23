import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Leaf, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LIFESTYLE_FOCUS_OPTIONS = [
  { value: "alcohol_free", label: "Alcohol-free", description: "Observe alcohol-free patterns" },
  { value: "reduce_sugar", label: "Reduce Sugar", description: "Track low-sugar choices" },
  { value: "improve_sleep", label: "Improve Sleep Timing", description: "Earlier rest patterns" },
  { value: "reduce_caffeine", label: "Reduce Caffeine", description: "Lower caffeine intake" },
  { value: "reduce_late_meals", label: "Reduce Late Meals", description: "Earlier eating window" },
  { value: "gut_health", label: "Gut Health", description: "Gut-supporting nutrition" },
];

export function LifestyleFocusManager({ userId }: { userId: string }) {
  const [focuses, setFocuses] = useState<any[]>([]);
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAlcoholPrompt, setShowAlcoholPrompt] = useState(false);
  const [alcoholFreeDays, setAlcoholFreeDays] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadFocuses();
  }, [userId]);

  // Realtime subscription for lifestyle focus changes
  useEffect(() => {
    const channel = supabase
      .channel('lifestyle-focus-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lifestyle_focus',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadFocuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadFocuses = async () => {
    try {
      const { data, error } = await supabase
        .from("lifestyle_focus")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "user_declared"]);

      if (error) throw error;
      setFocuses(data || []);
    } catch (error) {
      console.error("Error loading focuses:", error);
    }
  };

  const handleSaveFocuses = async () => {
    setLoading(true);
    try {
      // Remove unselected focuses
      const focusesToRemove = focuses.filter((f) => !selectedFocuses.includes(f.focus_type));
      for (const focus of focusesToRemove) {
        await supabase
          .from("lifestyle_focus")
          .update({ status: "removed" })
          .eq("id", focus.id);
      }

      // Add new focuses
      const existingTypes = focuses.map((f) => f.focus_type);
      const newFocuses = selectedFocuses.filter((type) => !existingTypes.includes(type));
      
      // Check if alcohol_free is newly selected
      const isAlcoholFreeNew = newFocuses.includes("alcohol_free") && !existingTypes.includes("alcohol_free");
      
      if (isAlcoholFreeNew) {
        setShowAlcoholPrompt(true);
        setLoading(false);
        return;
      }
      
      if (newFocuses.length > 0) {
        await supabase.from("lifestyle_focus").insert(
          newFocuses.map((type) => ({
            user_id: userId,
            focus_type: type,
            status: "user_declared",
            confidence: 1.0,
          }))
        );
      }

      toast({
        title: "Lifestyle focus updated",
        description: "Aura will observe these patterns and highlight meaningful changes.",
      });

      setOpen(false);
      await loadFocuses();
    } catch (error: any) {
      console.error("Error saving focuses:", error);
      toast({
        title: "Error updating focuses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlcoholFreeBaseline = async () => {
    setLoading(true);
    try {
      const existingTypes = focuses.map((f) => f.focus_type);
      const newFocuses = selectedFocuses.filter((type) => !existingTypes.includes(type));
      
      await supabase.from("lifestyle_focus").insert(
        newFocuses.map((type) => ({
          user_id: userId,
          focus_type: type,
          status: "user_declared",
          confidence: 1.0,
        }))
      );

      const daysMessage = alcoholFreeDays 
        ? `Aura will observe these patterns starting from your ${alcoholFreeDays}-day baseline.`
        : "Aura will observe these patterns and highlight meaningful changes.";

      toast({
        title: "Lifestyle focus updated",
        description: daysMessage,
      });

      setShowAlcoholPrompt(false);
      setOpen(false);
      setAlcoholFreeDays("");
      await loadFocuses();
    } catch (error: any) {
      console.error("Error saving focuses:", error);
      toast({
        title: "Error updating focuses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFocus = async (focusId: string) => {
    try {
      await supabase.from("lifestyle_focus").update({ status: "removed" }).eq("id", focusId);
      await loadFocuses();
      toast({
        description: "Focus removed. Aura will continue observing other patterns.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing focus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[#6CB792]" />
              Lifestyle Focus
            </CardTitle>
            <CardDescription>
              Intentions Aura observes — no pressure, only understanding
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFocuses(focuses.map((f) => f.focus_type));
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Choose Your Lifestyle Focus</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Select patterns you want Aura to observe. These are intentions, not commitments.
                </p>
                <div className="space-y-3">
                  {LIFESTYLE_FOCUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={option.value}
                        checked={selectedFocuses.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFocuses([...selectedFocuses, option.value]);
                          } else {
                            setSelectedFocuses(selectedFocuses.filter((f) => f !== option.value));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground italic">
                    Aura will observe these patterns and highlight meaningful changes.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFocuses} disabled={loading}>
                  Save Focus Areas
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAlcoholPrompt} onOpenChange={setShowAlcoholPrompt}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Alcohol-Free Baseline</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  How many days have you been alcohol-free?
                </p>
                <p className="text-xs text-muted-foreground italic">
                  This helps Aura understand your starting point — no pressure, just context.
                </p>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 7"
                  value={alcoholFreeDays}
                  onChange={(e) => setAlcoholFreeDays(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowAlcoholPrompt(false);
                  setAlcoholFreeDays("");
                }}>
                  Skip
                </Button>
                <Button onClick={handleAlcoholFreeBaseline} disabled={loading}>
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {focuses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No focus areas selected yet. Aura can observe specific patterns you're working on.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {focuses.map((focus) => {
              const option = LIFESTYLE_FOCUS_OPTIONS.find((o) => o.value === focus.focus_type);
              return (
                <Badge
                  key={focus.id}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 bg-[#6CB792]/10 text-[#6CB792] border-[#6CB792]/20"
                >
                  <span className="mr-2">{option?.label || focus.focus_type}</span>
                  <button
                    onClick={() => handleRemoveFocus(focus.id)}
                    className="hover:bg-[#6CB792]/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}