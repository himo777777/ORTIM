import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface ContentDraft {
  id: string;
  type: 'chapter' | 'question' | 'algorithm';
  title: string;
  content: string;
  lastModified: Date;
  metadata: Record<string, unknown>;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'chapter' | 'question';
  content: string;
  variables: string[];
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  content: string;
  createdAt: Date;
  createdBy: string;
  changeLog: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'audio';
  url: string;
  thumbnailUrl?: string;
  size: number;
  uploadedAt: Date;
  tags: string[];
}

export interface ContentState {
  // Drafts
  drafts: ContentDraft[];
  currentDraft: ContentDraft | null;

  // Templates
  templates: ContentTemplate[];

  // Media
  mediaAssets: MediaAsset[];
  selectedMedia: MediaAsset | null;

  // UI State
  isEditing: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';

  // Actions - Drafts
  createDraft: (type: ContentDraft['type'], title: string) => ContentDraft;
  updateDraft: (id: string, updates: Partial<ContentDraft>) => void;
  deleteDraft: (id: string) => void;
  setCurrentDraft: (draft: ContentDraft | null) => void;
  saveDraft: () => void;
  loadDraft: (id: string) => ContentDraft | null;

  // Actions - Templates
  addTemplate: (template: Omit<ContentTemplate, 'id'>) => void;
  applyTemplate: (templateId: string, variables: Record<string, string>) => string;
  deleteTemplate: (id: string) => void;

  // Actions - Media
  addMediaAsset: (asset: Omit<MediaAsset, 'id' | 'uploadedAt'>) => void;
  deleteMediaAsset: (id: string) => void;
  setSelectedMedia: (asset: MediaAsset | null) => void;
  searchMedia: (query: string) => MediaAsset[];

  // Actions - UI
  setIsEditing: (value: boolean) => void;
  setIsSaving: (value: boolean) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;

  // Utilities
  getRecentDrafts: (limit?: number) => ContentDraft[];
  getDraftsByType: (type: ContentDraft['type']) => ContentDraft[];
  autoSave: () => void;
}

// ============================================
// Default Templates
// ============================================

const defaultTemplates: ContentTemplate[] = [
  {
    id: 'chapter-basic',
    name: 'Grundläggande kapitel',
    description: 'En enkel kapitelstruktur med introduktion, huvudinnehåll och sammanfattning',
    type: 'chapter',
    content: `<h2>{{title}}</h2>

<h3>Introduktion</h3>
<p>{{introduction}}</p>

<h3>Huvudinnehåll</h3>
<p>{{mainContent}}</p>

<h3>Viktiga punkter</h3>
<ul>
  <li>Punkt 1</li>
  <li>Punkt 2</li>
  <li>Punkt 3</li>
</ul>

<h3>Sammanfattning</h3>
<p>{{summary}}</p>`,
    variables: ['title', 'introduction', 'mainContent', 'summary'],
  },
  {
    id: 'chapter-clinical',
    name: 'Kliniskt kapitel',
    description: 'Kapitelstruktur för kliniska ämnen med fallbeskrivning och behandlingsprotokoll',
    type: 'chapter',
    content: `<h2>{{title}}</h2>

<div class="alert alert-info">
  <strong>Lärandemål:</strong> {{learningObjectives}}
</div>

<h3>Bakgrund</h3>
<p>{{background}}</p>

<h3>Patofysiologi</h3>
<p>{{pathophysiology}}</p>

<h3>Klinisk presentation</h3>
<p>{{clinicalPresentation}}</p>

<h3>Diagnostik</h3>
<p>{{diagnostics}}</p>

<h3>Behandling</h3>
<p>{{treatment}}</p>

<h3>Fallbeskrivning</h3>
<div class="case-study">
  <p>{{caseStudy}}</p>
</div>

<h3>Sammanfattning</h3>
<p>{{summary}}</p>`,
    variables: ['title', 'learningObjectives', 'background', 'pathophysiology', 'clinicalPresentation', 'diagnostics', 'treatment', 'caseStudy', 'summary'],
  },
  {
    id: 'chapter-algorithm',
    name: 'Algoritmkapitel',
    description: 'Kapitelstruktur för behandlingsalgoritmer och beslutsträd',
    type: 'chapter',
    content: `<h2>{{title}}</h2>

<h3>Översikt</h3>
<p>{{overview}}</p>

<h3>Algoritm</h3>
<div class="algorithm-container">
  <!-- Infoga algoritmbild här -->
</div>

<h3>Steg-för-steg</h3>
<ol>
  <li><strong>Steg 1:</strong> {{step1}}</li>
  <li><strong>Steg 2:</strong> {{step2}}</li>
  <li><strong>Steg 3:</strong> {{step3}}</li>
</ol>

<h3>Undantag och specialfall</h3>
<p>{{exceptions}}</p>

<h3>Referenser</h3>
<p>{{references}}</p>`,
    variables: ['title', 'overview', 'step1', 'step2', 'step3', 'exceptions', 'references'],
  },
  {
    id: 'question-mcq',
    name: 'Flervalsfråga',
    description: 'Mall för flervalsfråga med förklaring',
    type: 'question',
    content: `{{questionText}}

A) {{optionA}}
B) {{optionB}}
C) {{optionC}}
D) {{optionD}}

Rätt svar: {{correctAnswer}}

Förklaring: {{explanation}}`,
    variables: ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation'],
  },
];

// ============================================
// Store
// ============================================

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      // Initial state
      drafts: [],
      currentDraft: null,
      templates: defaultTemplates,
      mediaAssets: [],
      selectedMedia: null,
      isEditing: false,
      isSaving: false,
      hasUnsavedChanges: false,
      previewMode: 'desktop',

      // Draft actions
      createDraft: (type, title) => {
        const draft: ContentDraft = {
          id: crypto.randomUUID(),
          type,
          title,
          content: '',
          lastModified: new Date(),
          metadata: {},
        };

        set((state) => ({
          drafts: [draft, ...state.drafts],
          currentDraft: draft,
          isEditing: true,
          hasUnsavedChanges: false,
        }));

        return draft;
      },

      updateDraft: (id, updates) => {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === id
              ? { ...d, ...updates, lastModified: new Date() }
              : d
          ),
          currentDraft:
            state.currentDraft?.id === id
              ? { ...state.currentDraft, ...updates, lastModified: new Date() }
              : state.currentDraft,
          hasUnsavedChanges: true,
        }));
      },

      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
        }));
      },

      setCurrentDraft: (draft) => {
        set({ currentDraft: draft, isEditing: !!draft });
      },

      saveDraft: () => {
        const { currentDraft } = get();
        if (!currentDraft) return;

        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === currentDraft.id
              ? { ...currentDraft, lastModified: new Date() }
              : d
          ),
          hasUnsavedChanges: false,
        }));
      },

      loadDraft: (id) => {
        const draft = get().drafts.find((d) => d.id === id) || null;
        if (draft) {
          set({ currentDraft: draft, isEditing: true });
        }
        return draft;
      },

      // Template actions
      addTemplate: (template) => {
        const newTemplate: ContentTemplate = {
          ...template,
          id: crypto.randomUUID(),
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      applyTemplate: (templateId, variables) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return '';

        let content = template.content;
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return content;
      },

      deleteTemplate: (id) => {
        // Don't delete default templates
        if (defaultTemplates.find((t) => t.id === id)) return;

        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      // Media actions
      addMediaAsset: (asset) => {
        const newAsset: MediaAsset = {
          ...asset,
          id: crypto.randomUUID(),
          uploadedAt: new Date(),
        };

        set((state) => ({
          mediaAssets: [newAsset, ...state.mediaAssets],
        }));
      },

      deleteMediaAsset: (id) => {
        set((state) => ({
          mediaAssets: state.mediaAssets.filter((m) => m.id !== id),
          selectedMedia: state.selectedMedia?.id === id ? null : state.selectedMedia,
        }));
      },

      setSelectedMedia: (asset) => {
        set({ selectedMedia: asset });
      },

      searchMedia: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().mediaAssets.filter(
          (m) =>
            m.name.toLowerCase().includes(lowerQuery) ||
            m.tags.some((t) => t.toLowerCase().includes(lowerQuery))
        );
      },

      // UI actions
      setIsEditing: (value) => set({ isEditing: value }),
      setIsSaving: (value) => set({ isSaving: value }),
      setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
      setPreviewMode: (mode) => set({ previewMode: mode }),

      // Utilities
      getRecentDrafts: (limit = 5) => {
        return [...get().drafts]
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, limit);
      },

      getDraftsByType: (type) => {
        return get().drafts.filter((d) => d.type === type);
      },

      autoSave: () => {
        const { currentDraft, hasUnsavedChanges } = get();
        if (currentDraft && hasUnsavedChanges) {
          get().saveDraft();
        }
      },
    }),
    {
      name: 'b-ortim-content',
      partialize: (state) => ({
        drafts: state.drafts,
        templates: state.templates,
        mediaAssets: state.mediaAssets,
      }),
    }
  )
);
