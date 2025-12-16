import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@b-ortim/shared';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  isOnline: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setOnline: (isOnline: boolean) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      theme: 'system',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      // Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },

      setOnline: (isOnline) => {
        set({ isOnline });
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const theme = parsed.state?.theme || 'system';
      const root = document.documentElement;

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    } catch {
      // Ignore parse errors
    }
  }
}
