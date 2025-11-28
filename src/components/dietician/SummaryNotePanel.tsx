import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flag, StickyNote, Trash2, Save } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  note: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  weekly_summary_id: string | null;
}

interface SummaryNotePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  summaryId: string | null;
  onNotesUpdated?: () => void;
}

export const SummaryNotePanel = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  summaryId,
  onNotesUpdated,
}: SummaryNotePanelProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isFlagged, setIsFlagged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      loadNotes();
    }
  }, [open, clientId, user]);

  const loadNotes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dietician_notes")
        .select("*")
        .eq("dietician_id", user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error: any) {
      console.error("Error loading notes:", error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !newNote.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("dietician_notes").insert({
        dietician_id: user.id,
        client_id: clientId,
        weekly_summary_id: summaryId,
        note: newNote.trim(),
        is_flagged: isFlagged,
      });

      if (error) throw error;

      toast({
        title: "Note saved",
        description: "Your note has been saved successfully",
      });

      setNewNote("");
      setIsFlagged(false);
      await loadNotes();
      onNotesUpdated?.();
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("dietician_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully",
      });

      await loadNotes();
      onNotesUpdated?.();
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleToggleFlag = async (noteId: string, currentFlag: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("dietician_notes")
        .update({ is_flagged: !currentFlag })
        .eq("id", noteId);

      if (error) throw error;

      await loadNotes();
      onNotesUpdated?.();
    } catch (error: any) {
      console.error("Error toggling flag:", error);
      toast({
        title: "Error",
        description: "Failed to update flag",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notes for {clientName}</SheetTitle>
          <SheetDescription>
            Add private notes and observations about this client's progress
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* New Note Form */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Add New Note</label>
            <Textarea
              placeholder="Enter your observations, concerns, or recommendations..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <Button
                variant={isFlagged ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsFlagged(!isFlagged)}
              >
                <Flag className="h-4 w-4 mr-2" fill={isFlagged ? "currentColor" : "none"} />
                {isFlagged ? "Flagged for Follow-up" : "Flag for Follow-up"}
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={!newNote.trim() || saving}
                className="bg-gradient-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Existing Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Previous Notes ({notes.length})
            </h3>

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading notes...</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notes yet. Add your first note above.
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg border ${
                      note.is_flagged ? "border-destructive/50 bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {note.is_flagged && (
                          <Badge variant="destructive" className="text-xs">
                            <Flag className="h-3 w-3 mr-1" fill="currentColor" />
                            Flagged
                          </Badge>
                        )}
                        {note.weekly_summary_id && (
                          <Badge variant="secondary" className="text-xs">
                            Weekly Summary
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggleFlag(note.id, note.is_flagged)}
                        >
                          <Flag
                            className="h-3 w-3"
                            fill={note.is_flagged ? "currentColor" : "none"}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};