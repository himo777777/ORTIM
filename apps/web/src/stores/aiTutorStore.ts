import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  clearHistory: () => void;
}

// Predefined responses for common questions (offline/fallback mode)
const PREDEFINED_RESPONSES: Record<string, string> = {
  'hej': 'Hej! 👋 Jag är din AI-studieassistent för B-ORTIM. Hur kan jag hjälpa dig idag? Du kan fråga mig om:\n\n• Ortopediska begrepp och definitioner\n• Förklaringar av algoritmer\n• Hjälp med quizfrågor\n• Studietekniker och tips',
  'hjälp': 'Jag kan hjälpa dig med:\n\n📚 **Kursinnehåll** - Förklara koncept, definitioner och procedurer\n🧠 **Quiz** - Gå igenom frågor och förklara rätt svar\n📊 **Studietips** - Personaliserade råd baserat på din prestation\n🔍 **Sök** - Hitta specifik information i kursmaterialet\n\nVad vill du veta mer om?',
  'tack': 'Varsågod! 😊 Fortsätt gärna fråga om du undrar något mer. Lycka till med studierna!',
};

// Context-aware response generation
function generateResponse(
  message: string,
  context?: { chapterId?: string; topic?: string }
): { content: string; suggestions: string[] } {
  const lowerMessage = message.toLowerCase().trim();

  // Check predefined responses
  for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
    if (lowerMessage.includes(key)) {
      return {
        content: response,
        suggestions: ['Berätta mer om kursen', 'Hur studerar jag effektivt?', 'Visa mina framsteg'],
      };
    }
  }

  // Topic-specific responses
  if (lowerMessage.includes('fraktur') || lowerMessage.includes('brott')) {
    return {
      content: '🦴 **Frakturer** är skelettskador där benet bryts helt eller delvis.\n\n**Typer av frakturer:**\n• **Öppen fraktur** - Benet penetrerar huden\n• **Sluten fraktur** - Huden är intakt\n• **Komminut fraktur** - Benet splittras i flera fragment\n• **Stressfraktur** - Mikroskopiska sprickor pga överbelastning\n\n**ABCDE-principen** gäller alltid vid trauma:\n1. Airway\n2. Breathing\n3. Circulation\n4. Disability\n5. Exposure\n\nVill du veta mer om specifika frakturtyper eller behandling?',
      suggestions: ['Berätta om öppna frakturer', 'Hur behandlas frakturer?', 'Vad är ATLS?'],
    };
  }

  if (lowerMessage.includes('trauma') || lowerMessage.includes('skada')) {
    return {
      content: '🚑 **Traumaomhändertagande** följer strukturerade protokoll för att säkerställa optimal vård.\n\n**Primary Survey (ABCDE):**\n• **A** - Airway med cervikalstabilisering\n• **B** - Breathing och ventilation\n• **C** - Circulation med blödningskontroll\n• **D** - Disability (neurologisk status)\n• **E** - Exposure/Environment\n\n**Secondary Survey:**\nFullständig undersökning från huvud till tå efter stabilisering.\n\nVad vill du veta mer om?',
      suggestions: ['Förklara C-spine', 'Vad är GCS?', 'Hur bedömer man blödning?'],
    };
  }

  if (lowerMessage.includes('studera') || lowerMessage.includes('lära') || lowerMessage.includes('tips')) {
    return {
      content: '📖 **Studietips för B-ORTIM:**\n\n1. **Spaced Repetition** 🔄\n   Använd repetitionskorten dagligen för optimal inlärning\n\n2. **Active Recall** 🧠\n   Testa dig själv istället för att bara läsa passivt\n\n3. **Pomodoro-tekniken** ⏱️\n   25 min fokuserad studie + 5 min paus\n\n4. **Teach Back** 👥\n   Förklara koncept för andra för djupare förståelse\n\n5. **Case-baserat lärande** 📋\n   Koppla teorin till praktiska scenarion\n\nDin AI-studieplan anpassas automatiskt baserat på din prestation!',
      suggestions: ['Visa min studieplan', 'Starta en quiz', 'Vilka områden behöver jag öva på?'],
    };
  }

  if (lowerMessage.includes('quiz') || lowerMessage.includes('fråga') || lowerMessage.includes('test')) {
    return {
      content: '📝 **Quiz och övning:**\n\nJag kan hjälpa dig med:\n\n• **Förklara frågor** - Berätta vilken fråga du undrar om\n• **Gå igenom svar** - Förklara varför ett svar är rätt/fel\n• **Rekommendera övningar** - Baserat på dina svaga områden\n\nDu har också tillgång till:\n• Adaptiva quiz som anpassar svårigheten\n• Spaced repetition-kort\n• Bloom-nivåbaserade frågor\n\nVad vill du öva på?',
      suggestions: ['Starta adaptiv quiz', 'Visa repetitionskort', 'Mina svaga områden'],
    };
  }

  // Default response
  return {
    content: `Jag förstår att du frågar om "${message}".\n\nSom din AI-studieassistent kan jag hjälpa dig med:\n\n• 📚 Förklara ortopediska koncept\n• 🧠 Gå igenom quizfrågor\n• 📊 Ge studierekommendationer\n• 🔍 Hitta information i kursmaterialet\n\nKan du specificera din fråga lite mer? Till exempel:\n- "Förklara skillnaden mellan X och Y"\n- "Hur fungerar Z?"\n- "Ge mig tips om att studera [ämne]"`,
    suggestions: ['Vad är B-ORTIM?', 'Hjälp mig förstå trauma', 'Ge mig studietips'],
  };
}

export const useAITutorStore = create<AITutorState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isOpen: false,
      isTyping: false,

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find(c => c.id === state.activeConversationId) || null;
      },

      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      toggleChat: () => set(state => ({ isOpen: !state.isOpen })),

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
                : 'Hej! 👋 Jag är din AI-studieassistent för B-ORTIM. Hur kan jag hjälpa dig idag?\n\nDu kan fråga mig om ortopediska koncept, få hjälp med quiz, eller få personliga studierekommendationer.',
              timestamp: now,
              suggestions: ['Förklara ett begrepp', 'Hjälp med en fråga', 'Ge mig studietips'],
            },
          ],
          createdAt: now,
          updatedAt: now,
          context,
        };

        set(state => ({
          conversations: [newConversation, ...state.conversations].slice(0, 50), // Keep last 50
          activeConversationId: id,
        }));

        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) => {
        set(state => {
          const newConversations = state.conversations.filter(c => c.id !== id);
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

        set(state => {
          let conversationId = state.activeConversationId;

          // Create new conversation if none exists
          if (!conversationId) {
            conversationId = get().createConversation();
          }

          return {
            conversations: state.conversations.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: [
                      ...conv.messages,
                      { ...message, id: messageId, timestamp: now },
                    ],
                    updatedAt: now,
                  }
                : conv
            ),
          };
        });

        // If user message, generate AI response
        if (message.role === 'user') {
          set({ isTyping: true });

          // Simulate AI thinking time
          setTimeout(() => {
            const { content, suggestions } = generateResponse(message.content, message.context);

            get().addMessage({
              role: 'assistant',
              content,
              suggestions,
            });

            set({ isTyping: false });
          }, 500 + Math.random() * 1000);
        }
      },

      updateLastMessage: (content, suggestions) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === state.activeConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg, idx) =>
                    idx === conv.messages.length - 1
                      ? { ...msg, content, suggestions, isLoading: false }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      setTyping: (isTyping) => set({ isTyping }),

      clearHistory: () => set({ conversations: [], activeConversationId: null }),
    }),
    {
      name: 'bortim-ai-tutor',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
