import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Heart,
  MessageCircle,
  Pin,
  CheckCircle,
  Send,
  Tag,
  Clock,
} from 'lucide-react';
import { useSocialStore, Discussion, Reply } from '@/stores/socialStore';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface DiscussionForumProps {
  groupId?: string;
  chapterId?: string;
  chapterTitle?: string;
}

export function DiscussionForum({ groupId, chapterId, chapterTitle }: DiscussionForumProps) {
  const {
    discussions,
    createDiscussion,
    addReply,
    likeDiscussion,
    likeReply,
    markAsAnswer,
    pinDiscussion,
    currentUserId,
    currentUserName,
  } = useSocialStore();

  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);

  const filteredDiscussions = discussions.filter(d => {
    if (groupId) return d.groupId === groupId;
    if (chapterId) return d.chapterId === chapterId;
    return true;
  });

  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    // Pinned first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const activeDiscussion = selectedDiscussion
    ? discussions.find(d => d.id === selectedDiscussion)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Diskussioner</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chapterTitle || 'Ställ frågor och hjälp varandra'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewDiscussion(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ny fråga</span>
        </button>
      </div>

      {/* Discussion List or Detail View */}
      <AnimatePresence mode="wait">
        {activeDiscussion ? (
          <DiscussionDetail
            key="detail"
            discussion={activeDiscussion}
            onBack={() => setSelectedDiscussion(null)}
            onReply={(content) => addReply(activeDiscussion.id, content)}
            onLike={() => likeDiscussion(activeDiscussion.id)}
            onLikeReply={(replyId) => likeReply(activeDiscussion.id, replyId)}
            onMarkAnswer={(replyId) => markAsAnswer(activeDiscussion.id, replyId)}
            onPin={() => pinDiscussion(activeDiscussion.id)}
            currentUserId={currentUserId}
            isAuthor={activeDiscussion.authorId === currentUserId}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {sortedDiscussions.map((discussion) => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                onClick={() => setSelectedDiscussion(discussion.id)}
                onLike={() => likeDiscussion(discussion.id)}
                isLiked={discussion.likedBy.includes(currentUserId)}
              />
            ))}

            {sortedDiscussions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Inga diskussioner än</p>
                <button
                  onClick={() => setShowNewDiscussion(true)}
                  className="mt-2 text-blue-500 hover:underline"
                >
                  Starta första diskussionen
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Discussion Modal */}
      <AnimatePresence>
        {showNewDiscussion && (
          <NewDiscussionModal
            onClose={() => setShowNewDiscussion(false)}
            onCreate={(data) => {
              createDiscussion({
                ...data,
                groupId,
                chapterId,
                authorId: currentUserId,
                authorName: currentUserName,
                isPinned: false,
              });
              setShowNewDiscussion(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Discussion Card Component
function DiscussionCard({
  discussion,
  onClick,
  onLike,
  isLiked,
}: {
  discussion: Discussion;
  onClick: () => void;
  onLike: () => void;
  isLiked: boolean;
}) {
  const hasAnswer = discussion.replies.some(r => r.isAnswer);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Author avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium flex-shrink-0">
          {discussion.authorName.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title with badges */}
          <div className="flex items-center gap-2 mb-1">
            {discussion.isPinned && (
              <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
            {hasAnswer && (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            <h3 className="font-semibold truncate">{discussion.title}</h3>
          </div>

          {/* Content preview */}
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {discussion.content}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{discussion.authorName}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(discussion.updatedAt), {
                addSuffix: true,
                locale: sv,
              })}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`flex items-center gap-1 hover:text-red-500 ${
                isLiked ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{discussion.likes}</span>
            </button>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{discussion.replies.length}</span>
            </span>
          </div>

          {/* Tags */}
          {discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Discussion Detail Component
function DiscussionDetail({
  discussion,
  onBack,
  onReply,
  onLike,
  onLikeReply,
  onMarkAnswer,
  onPin,
  currentUserId,
  isAuthor,
}: {
  discussion: Discussion;
  onBack: () => void;
  onReply: (content: string) => void;
  onLike: () => void;
  onLikeReply: (replyId: string) => void;
  onMarkAnswer: (replyId: string) => void;
  onPin: () => void;
  currentUserId: string;
  isAuthor: boolean;
}) {
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onReply(replyContent.trim());
    setReplyContent('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        ← Tillbaka till diskussioner
      </button>

      {/* Main post */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium flex-shrink-0">
            {discussion.authorName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {discussion.isPinned && <Pin className="w-4 h-4 text-amber-500" />}
              <h2 className="text-xl font-bold">{discussion.title}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {discussion.authorName} •{' '}
              {formatDistanceToNow(new Date(discussion.createdAt), {
                addSuffix: true,
                locale: sv,
              })}
            </p>
            <div className="prose dark:prose-invert max-w-none">
              <p>{discussion.content}</p>
            </div>

            {/* Tags */}
            {discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={onLike}
                className={`flex items-center gap-1 ${
                  discussion.likedBy.includes(currentUserId)
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    discussion.likedBy.includes(currentUserId) ? 'fill-current' : ''
                  }`}
                />
                <span>{discussion.likes} gillar</span>
              </button>
              {isAuthor && (
                <button
                  onClick={onPin}
                  className={`flex items-center gap-1 ${
                    discussion.isPinned ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'
                  }`}
                >
                  <Pin className="w-5 h-5" />
                  <span>{discussion.isPinned ? 'Fäst' : 'Fäst inlägg'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="font-semibold">
          {discussion.replies.length} svar
        </h3>

        {discussion.replies.map((reply) => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            onLike={() => onLikeReply(reply.id)}
            onMarkAnswer={() => onMarkAnswer(reply.id)}
            isLiked={reply.likedBy.includes(currentUserId)}
            canMarkAnswer={isAuthor}
          />
        ))}

        {discussion.replies.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Inga svar än. Var först med att svara!
          </p>
        )}
      </div>

      {/* Reply form */}
      <form onSubmit={handleSubmitReply} className="flex gap-3">
        <input
          type="text"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Skriv ett svar..."
          className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={!replyContent.trim()}
          className="px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}

// Reply Card Component
function ReplyCard({
  reply,
  onLike,
  onMarkAnswer,
  isLiked,
  canMarkAnswer,
}: {
  reply: Reply;
  onLike: () => void;
  onMarkAnswer: () => void;
  isLiked: boolean;
  canMarkAnswer: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        reply.isAnswer
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-white font-medium flex-shrink-0">
          {reply.authorName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{reply.authorName}</span>
            {reply.isAnswer && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs">
                <CheckCircle className="w-3 h-3" /> Bästa svaret
              </span>
            )}
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(reply.createdAt), {
                addSuffix: true,
                locale: sv,
              })}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{reply.content}</p>

          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 text-sm ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{reply.likes}</span>
            </button>
            {canMarkAnswer && !reply.isAnswer && (
              <button
                onClick={onMarkAnswer}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-500"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Markera som bästa svar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// New Discussion Modal
function NewDiscussionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; content: string; tags: string[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onCreate({
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full"
      >
        <h2 className="text-xl font-bold mb-4">Ny diskussion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vad vill du fråga eller diskutera?"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Innehåll</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beskriv din fråga i detalj..."
              rows={5}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              Taggar (komma-separerade)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="frakturer, trauma, akut"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Publicera
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
