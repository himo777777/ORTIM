import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Heart,
  Bookmark,
  Share2,
  Clock,
  Globe,
  Users,
  Lock,
  Search,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { useSocialStore, SharedNote } from '@/stores/socialStore';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface SharedNotesProps {
  chapterId?: string;
  chapterTitle?: string;
  groupId?: string;
}

export function SharedNotes({ chapterId, chapterTitle, groupId }: SharedNotesProps) {
  const {
    sharedNotes,
    shareNote,
    likeNote,
    bookmarkNote,
    currentUserId,
    currentUserName,
  } = useSocialStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'bookmarked'>('all');

  // Filter notes based on context
  let filteredNotes = sharedNotes.filter(note => {
    if (groupId) return note.groupId === groupId;
    if (chapterId) return note.chapterId === chapterId && note.sharedWith === 'public';
    return note.sharedWith === 'public';
  });

  // Apply search filter
  if (searchQuery) {
    filteredNotes = filteredNotes.filter(
      note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Apply bookmarked filter
  if (filter === 'bookmarked') {
    filteredNotes = filteredNotes.filter(note =>
      note.bookmarkedBy.includes(currentUserId)
    );
  }

  // Sort by likes and recency
  filteredNotes.sort((a, b) => {
    const likeDiff = b.likes - a.likes;
    if (likeDiff !== 0) return likeDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const activeNote = selectedNote
    ? sharedNotes.find(n => n.id === selectedNote)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Delade anteckningar</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chapterTitle || 'Lär av varandras anteckningar'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Dela anteckning</span>
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök anteckningar..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Alla
          </button>
          <button
            onClick={() => setFilter('bookmarked')}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              filter === 'bookmarked'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Sparade</span>
          </button>
        </div>
      </div>

      {/* Notes Grid or Detail View */}
      <AnimatePresence mode="wait">
        {activeNote ? (
          <NoteDetail
            key="detail"
            note={activeNote}
            onBack={() => setSelectedNote(null)}
            onLike={() => likeNote(activeNote.id)}
            onBookmark={() => bookmarkNote(activeNote.id)}
            isLiked={activeNote.likedBy.includes(currentUserId)}
            isBookmarked={activeNote.bookmarkedBy.includes(currentUserId)}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setSelectedNote(note.id)}
                onLike={() => likeNote(note.id)}
                onBookmark={() => bookmarkNote(note.id)}
                isLiked={note.likedBy.includes(currentUserId)}
                isBookmarked={note.bookmarkedBy.includes(currentUserId)}
              />
            ))}

            {filteredNotes.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  {filter === 'bookmarked'
                    ? 'Du har inga sparade anteckningar'
                    : 'Inga delade anteckningar'}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 text-amber-500 hover:underline"
                  >
                    Dela din första anteckning
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateNoteModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(data) => {
              shareNote({
                ...data,
                chapterId: chapterId || 'general',
                chapterTitle: chapterTitle || 'Allmänt',
                authorId: currentUserId,
                authorName: currentUserName,
                groupId,
              });
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Note Card Component
function NoteCard({
  note,
  onClick,
  onLike,
  onBookmark,
  isLiked,
  isBookmarked,
}: {
  note: SharedNote;
  onClick: () => void;
  onLike: () => void;
  onBookmark: () => void;
  isLiked: boolean;
  isBookmarked: boolean;
}) {
  const visibilityIcon = {
    public: <Globe className="w-3 h-3" />,
    group: <Users className="w-3 h-3" />,
    private: <Lock className="w-3 h-3" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold line-clamp-1 group-hover:text-amber-500 transition-colors">
          {note.title}
        </h3>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs">
          {visibilityIcon[note.sharedWith]}
          <span className="capitalize">{note.sharedWith === 'public' ? 'Publik' : note.sharedWith === 'group' ? 'Grupp' : 'Privat'}</span>
        </span>
      </div>

      {/* Preview */}
      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
        {note.content.slice(0, 150)}...
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-white text-xs font-medium">
            {note.authorName.charAt(0)}
          </div>
          <span className="text-sm text-gray-500">{note.authorName}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={`flex items-center gap-1 text-sm ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{note.likes}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className={`${
              isBookmarked ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Note Detail Component
function NoteDetail({
  note,
  onBack,
  onLike,
  onBookmark,
  isLiked,
  isBookmarked,
}: {
  note: SharedNote;
  onBack: () => void;
  onLike: () => void;
  onBookmark: () => void;
  isLiked: boolean;
  isBookmarked: boolean;
}) {
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
        ← Tillbaka till anteckningar
      </button>

      {/* Note content */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{note.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-medium">
                  {note.authorName.charAt(0)}
                </div>
                <span>{note.authorName}</span>
              </div>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(note.updatedAt), {
                  addSuffix: true,
                  locale: sv,
                })}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                {note.chapterTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                isLiked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{note.likes}</span>
            </button>
            <button
              onClick={onBookmark}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                isBookmarked
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-amber-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{note.bookmarks}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}

// Create Note Modal
function CreateNoteModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; content: string; tags: string[]; sharedWith: 'public' | 'group' | 'private' }) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [sharedWith, setSharedWith] = useState<'public' | 'group' | 'private'>('public');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onCreate({
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      sharedWith,
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
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-4">Dela anteckning</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. ABCDE-sammanfattning"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Innehåll (stödjer Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Rubrik&#10;&#10;Din anteckning här...&#10;&#10;- Punktlista&#10;- Med flera punkter"
              rows={12}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono text-sm"
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
              placeholder="ABCDE, trauma, sammanfattning"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Synlighet</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer border-2 border-transparent has-[:checked]:border-amber-500">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={sharedWith === 'public'}
                  onChange={() => setSharedWith('public')}
                  className="sr-only"
                />
                <Globe className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium">Publik</div>
                  <div className="text-xs text-gray-500">Alla kan se</div>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer border-2 border-transparent has-[:checked]:border-amber-500">
                <input
                  type="radio"
                  name="visibility"
                  value="group"
                  checked={sharedWith === 'group'}
                  onChange={() => setSharedWith('group')}
                  className="sr-only"
                />
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Grupp</div>
                  <div className="text-xs text-gray-500">Endast gruppen</div>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer border-2 border-transparent has-[:checked]:border-amber-500">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={sharedWith === 'private'}
                  onChange={() => setSharedWith('private')}
                  className="sr-only"
                />
                <Lock className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium">Privat</div>
                  <div className="text-xs text-gray-500">Endast du</div>
                </div>
              </label>
            </div>
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
              className="flex-1 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 inline mr-2" />
              Dela
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
