import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  UserPlus,
  LogOut,
  Settings,
  MessageSquare,
  Clock,
  ChevronRight,
  Crown,
  Shield,
} from 'lucide-react';
import { useSocialStore, StudyGroup } from '@/stores/socialStore';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface StudyGroupsProps {
  onSelectGroup?: (groupId: string) => void;
}

export function StudyGroups({ onSelectGroup }: StudyGroupsProps) {
  const {
    groups,
    myGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    currentUserId,
  } = useSocialStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myGroupsList = filteredGroups.filter(g => myGroups.includes(g.id));
  const discoverGroups = filteredGroups.filter(g => !myGroups.includes(g.id) && !g.isPrivate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Studiegrupper</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Studera tillsammans med andra
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa grupp</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sök grupper eller taggar..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'my'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Mina grupper ({myGroupsList.length})
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'discover'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Upptäck ({discoverGroups.length})
        </button>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {(activeTab === 'my' ? myGroupsList : discoverGroups).map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isMember={myGroups.includes(group.id)}
              isOwner={group.createdBy === currentUserId}
              onJoin={() => joinGroup(group.id)}
              onLeave={() => leaveGroup(group.id)}
              onSelect={() => onSelectGroup?.(group.id)}
            />
          ))}
        </AnimatePresence>

        {(activeTab === 'my' ? myGroupsList : discoverGroups).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {activeTab === 'my'
                ? 'Du är inte med i någon grupp än'
                : 'Inga grupper att visa'}
            </p>
            {activeTab === 'my' && (
              <button
                onClick={() => setActiveTab('discover')}
                className="mt-2 text-green-500 hover:underline"
              >
                Upptäck grupper
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(data) => {
              createGroup(data);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Group Card Component
function GroupCard({
  group,
  isMember,
  isOwner,
  onJoin,
  onLeave,
  onSelect,
}: {
  group: StudyGroup;
  isMember: boolean;
  isOwner: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  const onlineCount = group.members.filter(m => m.isOnline).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{group.name}</h3>
            {group.isPrivate ? (
              <Lock className="w-4 h-4 text-gray-400" />
            ) : (
              <Globe className="w-4 h-4 text-gray-400" />
            )}
            {isOwner && <Crown className="w-4 h-4 text-amber-500" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {group.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{group.memberCount} medlemmar</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>{onlineCount} online</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(group.lastActivity), {
                  addSuffix: true,
                  locale: sv,
                })}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {group.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isMember ? (
            <>
              <button
                onClick={onSelect}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Öppna</span>
              </button>
              {!isOwner && (
                <button
                  onClick={onLeave}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Lämna</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onJoin}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm">Gå med</span>
            </button>
          )}
        </div>
      </div>

      {/* Member avatars */}
      {isMember && (
        <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex -space-x-2">
            {group.members.slice(0, 5).map((member, i) => (
              <div
                key={member.userId}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-xs font-medium text-white ring-2 ring-white dark:ring-gray-800"
                title={member.username}
              >
                {member.username.charAt(0)}
              </div>
            ))}
            {group.memberCount > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-gray-800">
                +{group.memberCount - 5}
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
        </div>
      )}
    </motion.div>
  );
}

// Create Group Modal
interface CreateGroupData {
  name: string;
  description: string;
  isPrivate: boolean;
  tags: string[];
  createdBy: string;
  inviteCode?: string;
}

function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: CreateGroupData) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      isPrivate,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdBy: 'current_user',
      inviteCode: isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
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
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full"
      >
        <h2 className="text-xl font-bold mb-4">Skapa studiegrupp</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gruppnamn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Ortopedi VT2024"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv vad gruppen fokuserar på..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Taggar (komma-separerade)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ortopedi, termin6, läkarprogrammet"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
            />
            <div>
              <span className="font-medium flex items-center gap-1">
                <Lock className="w-4 h-4" /> Privat grupp
              </span>
              <span className="text-sm text-gray-500">
                Endast inbjudna kan gå med
              </span>
            </div>
          </label>

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
              disabled={!name.trim()}
              className="flex-1 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Skapa
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
