import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// ===========================================
// Types
// ===========================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contextUsed?: Array<{
    type: string;
    id: string;
    title: string;
    relevance: number;
  }> | null;
  tokensUsed?: number | null;
  createdAt: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Recommendation {
  type: 'chapter_review' | 'quiz_practice' | 'spaced_repetition' | 'new_content' | 'weakness_focus';
  title: string;
  description: string;
  contentId: string;
  contentType: 'chapter' | 'quiz' | 'question';
  priority: number;
  estimatedMinutes?: number;
  metadata?: {
    lastAttemptScore?: number;
    daysAgo?: number;
    reviewCount?: number;
  };
}

export interface LearningProfile {
  userId: string;
  weakTopics: string[];
  strongTopics: string[];
  preferredTimes?: string[];
  averageSession?: number;
  learningStyle?: 'visual' | 'reading' | 'practice';
  updatedAt: string;
}

// ===========================================
// Chat Hooks
// ===========================================

/**
 * Hook for sending chat messages with non-streaming response
 */
export function useAIChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      message: string;
      conversationId?: string;
      contextChapterId?: string;
    }) => api.ai.chat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });
}

/**
 * Hook for streaming chat responses via SSE
 */
export function useAIChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatMessage['contextUsed']>([]);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const startStream = useCallback(
    async (data: {
      message: string;
      conversationId?: string;
      contextChapterId?: string;
    }) => {
      setIsStreaming(true);
      setStreamedContent('');
      setSources([]);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(api.ai.getStreamUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
          signal: abortControllerRef.current.signal,
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7);
              continue;
            }
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                // Handle different event types
                if (data.startsWith('{')) {
                  const parsed = JSON.parse(data);
                  if (parsed.id) {
                    setConversationId(parsed.id);
                  }
                  if (parsed.error) {
                    setError(parsed.error);
                  }
                } else if (data.startsWith('[')) {
                  // Sources array
                  setSources(JSON.parse(data));
                } else {
                  // Content chunk
                  setStreamedContent((prev) => prev + data);
                }
              } catch {
                // Plain text content
                setStreamedContent((prev) => prev + data);
              }
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [token, queryClient]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    startStream,
    stopStream,
    isStreaming,
    streamedContent,
    conversationId,
    sources,
    error,
  };
}

// ===========================================
// Conversation Hooks
// ===========================================

/**
 * Hook to fetch all conversations
 */
export function useConversations(limit = 20) {
  return useQuery({
    queryKey: ['ai', 'conversations', limit],
    queryFn: () => api.ai.getConversations(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single conversation with messages
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['ai', 'conversation', conversationId],
    queryFn: () => api.ai.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => api.ai.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });
}

// ===========================================
// Content Assistance Hooks
// ===========================================

/**
 * Hook to get AI summary of a chapter
 */
export function useChapterSummary(
  chapterId: string | null,
  format: 'brief' | 'detailed' | 'bullet_points' = 'brief'
) {
  return useQuery({
    queryKey: ['ai', 'summary', chapterId, format],
    queryFn: () => api.ai.summarizeChapter(chapterId!, format),
    enabled: !!chapterId,
    staleTime: 30 * 60 * 1000, // 30 minutes (summaries don't change)
  });
}

/**
 * Hook to get AI explanation of a quiz question
 */
export function useQuestionExplanation(
  questionId: string | null,
  includeRelatedConcepts = true
) {
  return useQuery({
    queryKey: ['ai', 'explanation', questionId, includeRelatedConcepts],
    queryFn: () => api.ai.explainQuestion(questionId!, includeRelatedConcepts),
    enabled: !!questionId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Mutation hook for on-demand summary generation
 */
export function useGenerateSummary() {
  return useMutation({
    mutationFn: ({
      chapterId,
      format = 'brief',
    }: {
      chapterId: string;
      format?: 'brief' | 'detailed' | 'bullet_points';
    }) => api.ai.summarizeChapter(chapterId, format),
  });
}

/**
 * Mutation hook for on-demand question explanation
 */
export function useGenerateExplanation() {
  return useMutation({
    mutationFn: ({
      questionId,
      includeRelatedConcepts = true,
    }: {
      questionId: string;
      includeRelatedConcepts?: boolean;
    }) => api.ai.explainQuestion(questionId, includeRelatedConcepts),
  });
}

// ===========================================
// Recommendations & Learning Profile Hooks
// ===========================================

/**
 * Hook to fetch personalized recommendations
 */
export function useRecommendations() {
  return useQuery({
    queryKey: ['ai', 'recommendations'],
    queryFn: () => api.ai.getRecommendations(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch user's learning profile
 */
export function useLearningProfile() {
  return useQuery({
    queryKey: ['ai', 'learning-profile'],
    queryFn: () => api.ai.getLearningProfile(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ===========================================
// Combined Hooks
// ===========================================

/**
 * Combined hook for AI chat with both streaming and non-streaming support
 */
export function useAITutor(options?: { enableStreaming?: boolean }) {
  const { enableStreaming = true } = options || {};
  const chatMutation = useAIChat();
  const streamChat = useAIChatStream();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string, contextChapterId?: string) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      if (enableStreaming) {
        // Add placeholder for streaming response
        const assistantMessage: ChatMessage = {
          id: `streaming-${Date.now()}`,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        await streamChat.startStream({
          message: content,
          conversationId: currentConversationId || undefined,
          contextChapterId,
        });

        // Update the streaming message with final content
        setMessages((prev) => {
          const updated = [...prev];
          const streamingIndex = updated.findIndex((m) => m.isStreaming);
          if (streamingIndex !== -1) {
            updated[streamingIndex] = {
              ...updated[streamingIndex],
              content: streamChat.streamedContent,
              contextUsed: streamChat.sources,
              isStreaming: false,
            };
          }
          return updated;
        });

        if (streamChat.conversationId) {
          setCurrentConversationId(streamChat.conversationId);
        }
      } else {
        const response = await chatMutation.mutateAsync({
          message: content,
          conversationId: currentConversationId || undefined,
          contextChapterId,
        });

        const assistantMessage: ChatMessage = {
          id: response.messageId,
          role: 'assistant',
          content: response.content,
          contextUsed: response.sourcesUsed,
          tokensUsed: response.tokensUsed,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentConversationId(response.conversationId);
      }
    },
    [
      enableStreaming,
      currentConversationId,
      streamChat,
      chatMutation,
    ]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const loadConversation = useCallback((conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
  }, []);

  return {
    messages,
    sendMessage,
    clearConversation,
    loadConversation,
    currentConversationId,
    isLoading: enableStreaming ? streamChat.isStreaming : chatMutation.isPending,
    error: enableStreaming ? streamChat.error : (chatMutation.error as Error)?.message,
    streamedContent: streamChat.streamedContent,
  };
}

/**
 * Hook to get recommendation type icon and color
 */
export function useRecommendationStyle(type: Recommendation['type']) {
  const styles = {
    chapter_review: {
      icon: 'BookOpen',
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    quiz_practice: {
      icon: 'FileQuestion',
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    spaced_repetition: {
      icon: 'Brain',
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    new_content: {
      icon: 'Sparkles',
      color: 'amber',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    weakness_focus: {
      icon: 'Target',
      color: 'red',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
    },
  };

  return styles[type] || styles.chapter_review;
}
