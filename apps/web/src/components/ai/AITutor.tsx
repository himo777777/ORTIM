import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  ChevronLeft,
  Plus,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useAITutorStore, Conversation } from '@/stores/aiTutorStore';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AITutorProps {
  context?: {
    chapterId?: string;
    chapterTitle?: string;
  };
}

export function AITutor({ context }: AITutorProps) {
  const {
    isOpen,
    isTyping,
    conversations,
    activeConversationId,
    toggleChat,
    closeChat,
    createConversation,
    setActiveConversation,
    deleteConversation,
    addMessage,
    getActiveConversation,
  } = useAITutorStore();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = getActiveConversation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Use the real API for AI responses
    const sendMessage = useAITutorStore.getState().sendMessageToAPI;
    sendMessage(
      input.trim(),
      context ? { chapterId: context.chapterId, topic: context.chapterTitle } : undefined
    );

    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Use the real API for AI responses
    const sendMessage = useAITutorStore.getState().sendMessageToAPI;
    sendMessage(
      suggestion,
      context ? { chapterId: context.chapterId, topic: context.chapterTitle } : undefined
    );
  };

  const handleNewChat = () => {
    createConversation(context);
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen
            ? 'bg-gray-700 text-white'
            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Stäng AI-tutor' : 'Öppna AI-tutor'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative"
            >
              <Bot className="w-6 h-6" />
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[32rem] max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-between">
              {showHistory ? (
                <>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-medium">Tillbaka</span>
                  </button>
                  <button
                    onClick={handleNewChat}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Ny</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI-tutor</h3>
                      <p className="text-xs text-purple-100">Din studieassistent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHistory(true)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Historik"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                    <button
                      onClick={closeChat}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            {showHistory ? (
              <ConversationHistory
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={(id) => {
                  setActiveConversation(id);
                  setShowHistory(false);
                }}
                onDelete={deleteConversation}
              />
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeConversation?.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="flex gap-1">
                          <motion.span
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.span
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                          />
                          <motion.span
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Suggestions */}
                  {activeConversation && activeConversation.messages.length > 0 && !isTyping && (
                    <SuggestionChips
                      suggestions={
                        activeConversation.messages[activeConversation.messages.length - 1]
                          ?.suggestions || []
                      }
                      onSelect={handleSuggestionClick}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ställ en fråga..."
                      className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500 outline-none"
                      disabled={isTyping}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: { role: string; content: string } }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-primary-500'
            : 'bg-gradient-to-br from-purple-500 to-indigo-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-500 text-white rounded-tr-none'
            : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'
        }`}
      >
        <div
          className={`text-sm whitespace-pre-wrap ${
            isUser ? '' : 'prose prose-sm dark:prose-invert max-w-none'
          }`}
          dangerouslySetInnerHTML={{
            __html: isUser
              ? message.content
              : message.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br />'),
          }}
        />
      </div>
    </motion.div>
  );
}

// Suggestion Chips Component
function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-2"
    >
      {suggestions.map((suggestion, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
}

// Conversation History Component
function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
        <BookOpen className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-center">Ingen konversationshistorik</p>
        <p className="text-sm text-center mt-1">Starta en ny konversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => (
        <motion.div
          key={conv.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group ${
            conv.id === activeId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
          }`}
          onClick={() => onSelect(conv.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{conv.title}</p>
              <p className="text-sm text-gray-500 truncate">
                {conv.messages[conv.messages.length - 1]?.content.slice(0, 50)}...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(conv.updatedAt), {
                  addSuffix: true,
                  locale: sv,
                })}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
