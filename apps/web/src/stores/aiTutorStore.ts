import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useAuthStore } from './authStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  context?: {
    chapterId?: string;
    questionId?: string;
    topic?: string;
  };
  suggestions?: string[];
  isLoading?: boolean;
  isStreaming?: boolean;
  sourcesUsed?: Array<{
    type: string;
    id: string;
    title: string;
    relevance: number;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  context?: {
    chapterId?: string;
    chapterTitle?: string;
  };
}

export interface AITutorState {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  isTyping: boolean;
  streamingContent: string;
  error: string | null;

  // Getters
  getActiveConversation: () => Conversation | null;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;

  createConversation: (context?: { chapterId?: string; chapterTitle?: string }) => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string, suggestions?: string[]) => void;
  setTyping: (isTyping: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  finalizeStreamingMessage: (sourcesUsed?: ChatMessage['sourcesUsed']) => void;
  setError: (error: string | null) => void;

  clearHistory: () => void;

  // API Actions
  sendMessageToAPI: (content: string, context?: { chapterId?: string; topic?: string }) => Promise<void>;
  sendMessageWithStreaming: (content: string, context?: { chapterId?: string; topic?: string }) => Promise<void>;
  loadConversationsFromAPI: () => Promise<void>;
  loadConversationFromAPI: (conversationId: string) => Promise<void>;
}

// Default suggestions based on context
function getDefaultSuggestions(hasContext: boolean): string[] {
  if (hasContext) {
    return ['Förklara huvudbegreppen', 'Sammanfatta kapitlet', 'Ge mig övningsfrågor'];
  }
  return ['Vad är ORTAC?', 'Hjälp mig förstå trauma', 'Ge mig studietips'];
}

// Fallback responses for offline mode
const OFFLINE_RESPONSES: Record<string, { content: string; suggestions: string[] }> = {
  default: {
    content: 'Jag är tyvärr inte tillgänglig just nu. Kontrollera din internetanslutning och försök igen.\n\nUnder tiden kan du:\n• Läsa kursmaterialet offline\n• Öva med sparade quiz\n• Repetera med flashcards',
    suggestions: ['Försök igen', 'Fortsätt offline'],
  },
};

export const useAITutorStore = create<AITutorState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isOpen: false,
      isTyping: false,
      streamingContent: '',
      error: null,

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.activeConversationId) || null;
      },

      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

      createConversation: (context) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const newConversation: Conversation = {
          id,
          title: context?.chapterTitle || 'Ny konversation',
          messages: [
            {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: context?.chapterTitle
                ? `Hej! 👋 Jag ser att du studerar **${context.chapterTitle}**. Hur kan jag hjälpa dig med detta kapitel?\n\nDu kan fråga mig om:\n• Förklaringar av begrepp\n• Samband mellan koncept\n• Praktiska tillämpningar\n• Hjälp med övningar`
                : 'Hej! 👋 Jag är din AI-studieassistent för ORTAC. Hur kan jag hjälpa dig idag?\n\nDu kan fråga mig om ortopediska koncept, få hjälp med quiz, eller få personliga studierekommendationer.',
              timestamp: now,
              suggestions: getDefaultSuggestions(!!context),
            },
          ],
          createdAt: now,
          updatedAt: now,
          context,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations].slice(0, 50),
          activeConversationId: id,
        }));

        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: async (id) => {
        // Try to delete from API first
        try {
          await api.ai.deleteConversation(id);
        } catch (error) {
          console.warn('Failed to delete conversation from API:', error);
        }

        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: newConversations,
            activeConversationId:
              state.activeConversationId === id
                ? newConversations[0]?.id || null
                : state.activeConversationId,
          };
        });
      },

      addMessage: (message) => {
        const now = new Date().toISOString();
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        set((state) => {
          let conversationId = state.activeConversationId;

          if (!conversationId) {
            conversationId = get().createConversation();
          }

          return {
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, { ...message, id: messageId, timestamp: now }],
                    updatedAt: now,
                  }
                : conv
            ),
          };
        });
      },

      updateLastMessage: (content, suggestions) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === state.activeConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg, idx) =>
                    idx === conv.messages.length - 1
                      ? { ...msg, content, suggestions, isLoading: false, isStreaming: false }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      setTyping: (isTyping) => set({ isTyping }),
      setStreamingContent: (content) => set({ streamingContent: content }),
      appendStreamingContent: (chunk) =>
        set((state) => ({ streamingContent: state.streamingContent + chunk })),
      setError: (error) => set({ error }),

      finalizeStreamingMessage: (sourcesUsed) => {
        const state = get();
        const content = state.streamingContent;

        set((s) => ({
          streamingContent: '',
          isTyping: false,
          conversations: s.conversations.map((conv) =>
            conv.id === s.activeConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg, idx) =>
                    idx === conv.messages.length - 1
                      ? {
                          ...msg,
                          content,
                          isStreaming: false,
                          sourcesUsed,
                          suggestions: ['Berätta mer', 'Relaterade frågor', 'Förklara enklare'],
                        }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      clearHistory: () => set({ conversations: [], activeConversationId: null }),

      // API Actions
      sendMessageToAPI: async (content, context) => {
        const state = get();
        let conversationId = state.activeConversationId;

        // Create conversation if needed
        if (!conversationId) {
          conversationId = get().createConversation(
            context?.topic ? { chapterTitle: context.topic, chapterId: context.chapterId } : undefined
          );
        }

        // Add user message immediately
        get().addMessage({
          role: 'user',
          content,
          context,
        });

        set({ isTyping: true, error: null });

        try {
          // Check if user is authenticated
          const token = useAuthStore.getState().token;
          if (!token) {
            throw new Error('Not authenticated');
          }

          // Find the backend conversation ID (might be different from local)
          const activeConv = get().getActiveConversation();
          const backendConvId = activeConv?.id.startsWith('conv_') ? undefined : activeConv?.id;

          const response = await api.ai.chat({
            message: content,
            conversationId: backendConvId,
            contextChapterId: context?.chapterId,
          });

          // Update local conversation ID if backend returned one
          if (response.conversationId && activeConv) {
            set((s) => ({
              conversations: s.conversations.map((conv) =>
                conv.id === s.activeConversationId
                  ? { ...conv, id: response.conversationId }
                  : conv
              ),
              activeConversationId: response.conversationId,
            }));
          }

          // Add assistant response
          get().addMessage({
            role: 'assistant',
            content: response.content,
            sourcesUsed: response.sourcesUsed,
            suggestions: ['Berätta mer', 'Relaterade koncept', 'Förklara enklare'],
          });
        } catch (error) {
          console.error('AI chat error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Ett fel uppstod';

          set({ error: errorMessage });

          // Add fallback response
          get().addMessage({
            role: 'assistant',
            content: OFFLINE_RESPONSES.default.content,
            suggestions: OFFLINE_RESPONSES.default.suggestions,
          });
        } finally {
          set({ isTyping: false });
        }
      },

      sendMessageWithStreaming: async (content, context) => {
        const state = get();
        let conversationId = state.activeConversationId;

        // Create conversation if needed
        if (!conversationId) {
          conversationId = get().createConversation(
            context?.topic ? { chapterTitle: context.topic, chapterId: context.chapterId } : undefined
          );
        }

        // Add user message
        get().addMessage({
          role: 'user',
          content,
          context,
        });

        // Add placeholder for streaming response
        get().addMessage({
          role: 'assistant',
          content: '',
          isStreaming: true,
        });

        set({ isTyping: true, streamingContent: '', error: null });

        try {
          const token = useAuthStore.getState().token;
          if (!token) {
            throw new Error('Not authenticated');
          }

          const activeConv = get().getActiveConversation();
          const backendConvId = activeConv?.id.startsWith('conv_') ? undefined : activeConv?.id;

          const response = await fetch(api.ai.getStreamUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: content,
              conversationId: backendConvId,
              contextChapterId: context?.chapterId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';
          let sources: ChatMessage['sourcesUsed'] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                  if (data.startsWith('{')) {
                    const parsed = JSON.parse(data);
                    if (parsed.id) {
                      // Update conversation ID
                      set((s) => ({
                        conversations: s.conversations.map((conv) =>
                          conv.id === s.activeConversationId
                            ? { ...conv, id: parsed.id }
                            : conv
                        ),
                        activeConversationId: parsed.id,
                      }));
                    }
                  } else if (data.startsWith('[')) {
                    sources = JSON.parse(data);
                  } else {
                    get().appendStreamingContent(data);
                  }
                } catch {
                  get().appendStreamingContent(data);
                }
              }
            }
          }

          get().finalizeStreamingMessage(sources);
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Ett fel uppstod';

          set({ error: errorMessage, isTyping: false });

          // Update the streaming message with error
          get().updateLastMessage(
            OFFLINE_RESPONSES.default.content,
            OFFLINE_RESPONSES.default.suggestions
          );
        }
      },

      loadConversationsFromAPI: async () => {
        try {
          const conversations = await api.ai.getConversations();
          set({
            conversations: conversations.map((conv) => ({
              id: conv.id,
              title: conv.title || 'Konversation',
              messages: conv.messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.createdAt,
              })),
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt,
            })),
          });
        } catch (error) {
          console.warn('Failed to load conversations from API:', error);
        }
      },

      loadConversationFromAPI: async (conversationId) => {
        try {
          const conv = await api.ai.getConversation(conversationId);
          if (conv) {
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      messages: conv.messages.map((msg) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.createdAt,
                        sourcesUsed: msg.contextUsed || undefined,
                      })),
                    }
                  : c
              ),
              activeConversationId: conversationId,
            }));
          }
        } catch (error) {
          console.warn('Failed to load conversation:', error);
        }
      },
    }),
    {
      name: 'ortac-ai-tutor',
      partialize: (state) => ({
        conversations: state.conversations.slice(0, 10), // Only persist last 10
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
