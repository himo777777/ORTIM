import { useState } from 'react';
import {
  StickyNote,
  Trash2,
  Edit2,
  Plus,
  Search,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudyStore, Note } from '@/stores/studyStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface NotesPanelProps {
  className?: string;
  contentId?: string;
  contentType?: 'chapter' | 'algorithm' | 'quiz';
}

export function NotesPanel({ className, contentId, contentType }: NotesPanelProps) {
  const { notes, addNote, updateNote, removeNote } = useStudyStore();
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNewNote, setShowNewNote] = useState(false);

  // Filter notes - show all if no contentId, or filter by content
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(search.toLowerCase());
    const matchesContent = !contentId || note.contentId === contentId;
    return matchesSearch && matchesContent;
  });

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    addNote({
      content: newNoteContent,
      contentId,
      contentType,
    });

    setNewNoteContent('');
    setShowNewNote(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.content.trim()) return;

    updateNote(editingNote.id, editingNote.content);
    setEditingNote(null);
  };

  const groupNotesByDate = (notes: Note[]) => {
    const grouped: Record<string, Note[]> = {};

    notes.forEach((note) => {
      const date = format(new Date(note.createdAt), 'yyyy-MM-dd');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(note);
    });

    return Object.entries(grouped).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const groupedNotes = groupNotesByDate(filteredNotes);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('relative', className)}>
            <StickyNote className="h-5 w-5" />
            {notes.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {notes.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Anteckningar
              </span>
              <Button size="sm" onClick={() => setShowNewNote(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Ny
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök anteckningar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Notes list */}
            <ScrollArea className="h-[calc(100vh-220px)]">
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {notes.length === 0
                      ? 'Inga anteckningar ännu'
                      : 'Inga matchande anteckningar'}
                  </p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setShowNewNote(true)}
                  >
                    Skapa din första anteckning
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedNotes.map(([date, dateNotes]) => (
                    <div key={date}>
                      <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2 sticky top-0 bg-background py-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(date), 'd MMMM yyyy', { locale: sv })}
                      </h3>
                      <div className="space-y-2">
                        {dateNotes.map((note) => (
                          <div
                            key={note.id}
                            className="group p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {note.content}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(note.createdAt), {
                                  addSuffix: true,
                                  locale: sv,
                                })}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setEditingNote(note)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => removeNote(note.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* New Note Dialog */}
      <Dialog open={showNewNote} onOpenChange={setShowNewNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny anteckning</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Skriv din anteckning här..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[150px]"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNote(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera anteckning</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingNote?.content || ''}
            onChange={(e) =>
              setEditingNote((prev) =>
                prev ? { ...prev, content: e.target.value } : null
              )
            }
            className="min-h-[150px]"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              Avbryt
            </Button>
            <Button
              onClick={handleUpdateNote}
              disabled={!editingNote?.content.trim()}
            >
              Spara ändringar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline note input for content pages
interface InlineNoteInputProps {
  contentId: string;
  contentType: 'chapter' | 'algorithm' | 'quiz';
  className?: string;
}

export function InlineNoteInput({
  contentId,
  contentType,
  className,
}: InlineNoteInputProps) {
  const { addNote } = useStudyStore();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;

    addNote({
      content,
      contentId,
      contentType,
    });

    setContent('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={className}
      >
        <StickyNote className="h-4 w-4 mr-2" />
        Lägg till anteckning
      </Button>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Textarea
        placeholder="Skriv din anteckning..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px]"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setContent('');
            setIsExpanded(false);
          }}
        >
          Avbryt
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
          Spara
        </Button>
      </div>
    </div>
  );
}
