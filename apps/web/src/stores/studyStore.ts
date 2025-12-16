import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bookmark {
  id: string;
  contentId: string;
  type: 'chapter' | 'algorithm' | 'quiz';
  title: string;
  description?: string;
  url: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  contentId?: string;
  contentType?: 'chapter' | 'algorithm' | 'quiz';
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  chapterId: string;
  chapterSlug: string;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  createdAt: string;
}

export interface FocusSettings {
  pomodoroLength: number;
  soundEnabled: boolean;
  hideNavigation: boolean;
  dimBackground: boolean;
}

export interface ReadingSettings {
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'tight' | 'normal' | 'relaxed';
}

export interface StudyState {
  bookmarks: Bookmark[];
  notes: Note[];
  highlights: Highlight[];
  focusMode: boolean;
  focusSettings: FocusSettings;
  readingSettings: ReadingSettings;
  dailyGoalMinutes: number;
  todayStudyMinutes: number;
  lastStudyDate: string | null;

  // Bookmark actions
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (bookmarkId: string) => void;
  isBookmarked: (contentId: string) => boolean;

  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (noteId: string, content: string) => void;
  removeNote: (noteId: string) => void;
  getNotesForContent: (contentId: string) => Note[];

  // Highlight actions
  addHighlight: (
    chapterId: string,
    chapterSlug: string,
    text: string,
    color: Highlight['color']
  ) => void;
  removeHighlight: (highlightId: string) => void;
  getHighlightsForChapter: (chapterId: string) => Highlight[];

  // Focus mode actions
  toggleFocusMode: () => void;
  updateFocusSettings: (settings: Partial<FocusSettings>) => void;

  // Reading settings actions
  updateReadingSettings: (settings: Partial<ReadingSettings>) => void;

  // Study time tracking
  addStudyTime: (minutes: number) => void;
  resetDailyStudyTime: () => void;
  setDailyGoal: (minutes: number) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      notes: [],
      highlights: [],
      focusMode: false,
      focusSettings: {
        pomodoroLength: 25,
        soundEnabled: true,
        hideNavigation: false,
        dimBackground: false,
      },
      readingSettings: {
        fontSize: 'medium',
        lineHeight: 'normal',
      },
      dailyGoalMinutes: 15,
      todayStudyMinutes: 0,
      lastStudyDate: null,

      // Bookmark actions
      addBookmark: (bookmark) => {
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            {
              ...bookmark,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      removeBookmark: (bookmarkId) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
        }));
      },

      isBookmarked: (contentId) => {
        return get().bookmarks.some((b) => b.contentId === contentId);
      },

      // Note actions
      addNote: (note) => {
        const now = new Date().toISOString();
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: generateId(),
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
      },

      updateNote: (noteId, content) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, content, updatedAt: new Date().toISOString() }
              : note
          ),
        }));
      },

      removeNote: (noteId) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== noteId),
        }));
      },

      getNotesForContent: (contentId) => {
        return get().notes.filter((note) => note.contentId === contentId);
      },

      // Highlight actions
      addHighlight: (chapterId, chapterSlug, text, color) => {
        set((state) => ({
          highlights: [
            ...state.highlights,
            {
              id: generateId(),
              chapterId,
              chapterSlug,
              text,
              color,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      removeHighlight: (highlightId) => {
        set((state) => ({
          highlights: state.highlights.filter((h) => h.id !== highlightId),
        }));
      },

      getHighlightsForChapter: (chapterId) => {
        return get().highlights.filter((h) => h.chapterId === chapterId);
      },

      // Focus mode actions
      toggleFocusMode: () => {
        set((state) => ({
          focusMode: !state.focusMode,
        }));
      },

      updateFocusSettings: (settings) => {
        set((state) => ({
          focusSettings: { ...state.focusSettings, ...settings },
        }));
      },

      // Reading settings actions
      updateReadingSettings: (settings) => {
        set((state) => ({
          readingSettings: { ...state.readingSettings, ...settings },
        }));
      },

      // Study time tracking
      addStudyTime: (minutes) => {
        const today = new Date();
        const lastStudy = get().lastStudyDate ? new Date(get().lastStudyDate!) : null;

        set((state) => {
          // Reset if it's a new day
          if (lastStudy && !isSameDay(lastStudy, today)) {
            return {
              todayStudyMinutes: minutes,
              lastStudyDate: today.toISOString(),
            };
          }

          return {
            todayStudyMinutes: state.todayStudyMinutes + minutes,
            lastStudyDate: today.toISOString(),
          };
        });
      },

      resetDailyStudyTime: () => {
        set({ todayStudyMinutes: 0 });
      },

      setDailyGoal: (minutes) => {
        set({ dailyGoalMinutes: minutes });
      },
    }),
    {
      name: 'bortim-study',
    }
  )
);
