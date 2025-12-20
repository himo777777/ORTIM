import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Study Group Types
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  members: GroupMember[];
  isPrivate: boolean;
  inviteCode?: string;
  tags: string[];
  currentChapterId?: string;
  studyGoal?: string;
  lastActivity: string;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isOnline: boolean;
  lastSeen: string;
}

// Discussion Types
export interface Discussion {
  id: string;
  groupId?: string;
  chapterId?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
  likes: number;
  likedBy: string[];
  isPinned: boolean;
  tags: string[];
}

export interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  isAnswer?: boolean;
}

// Shared Note Types
export interface SharedNote {
  id: string;
  title: string;
  content: string;
  chapterId: string;
  chapterTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: 'public' | 'group' | 'private';
  groupId?: string;
  likes: number;
  likedBy: string[];
  bookmarks: number;
  bookmarkedBy: string[];
  tags: string[];
}

// Activity Feed Types
export interface ActivityItem {
  id: string;
  type: 'join_group' | 'new_discussion' | 'reply' | 'share_note' | 'achievement' | 'study_session';
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  data: Record<string, unknown>;
  groupId?: string;
}

export interface SocialState {
  // Study Groups
  groups: StudyGroup[];
  myGroups: string[];
  activeGroupId: string | null;

  // Discussions
  discussions: Discussion[];

  // Shared Notes
  sharedNotes: SharedNote[];

  // Activity Feed
  activityFeed: ActivityItem[];

  // Current user (mock)
  currentUserId: string;
  currentUserName: string;

  // Group Actions
  createGroup: (group: Omit<StudyGroup, 'id' | 'createdAt' | 'memberCount' | 'members' | 'lastActivity'>) => string;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  setActiveGroup: (groupId: string | null) => void;
  updateGroup: (groupId: string, updates: Partial<StudyGroup>) => void;

  // Discussion Actions
  createDiscussion: (discussion: Omit<Discussion, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'likes' | 'likedBy'>) => string;
  addReply: (discussionId: string, content: string) => void;
  likeDiscussion: (discussionId: string) => void;
  likeReply: (discussionId: string, replyId: string) => void;
  markAsAnswer: (discussionId: string, replyId: string) => void;
  pinDiscussion: (discussionId: string) => void;

  // Shared Notes Actions
  shareNote: (note: Omit<SharedNote, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'bookmarks' | 'bookmarkedBy'>) => string;
  likeNote: (noteId: string) => void;
  bookmarkNote: (noteId: string) => void;

  // Activity Actions
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;

  // Getters
  getGroupById: (id: string) => StudyGroup | undefined;
  getGroupDiscussions: (groupId: string) => Discussion[];
  getChapterDiscussions: (chapterId: string) => Discussion[];
  getGroupNotes: (groupId: string) => SharedNote[];
  getPublicNotes: (chapterId: string) => SharedNote[];
}

// Generate mock data for demo
const MOCK_USERS = [
  { id: 'user_1', name: 'Anna Svensson', avatar: undefined },
  { id: 'user_2', name: 'Erik Johansson', avatar: undefined },
  { id: 'user_3', name: 'Maria Lindberg', avatar: undefined },
  { id: 'user_4', name: 'Johan Andersson', avatar: undefined },
];

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      groups: [
        {
          id: 'group_1',
          name: 'Ortopedi VT2024',
          description: 'Studiegrupp för ortopedikursen vårterminen 2024. Vi träffas varje vecka för att diskutera kapitel och öva tillsammans.',
          createdBy: 'user_1',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          memberCount: 12,
          members: [
            { userId: 'user_1', username: 'Anna Svensson', role: 'owner', joinedAt: new Date().toISOString(), isOnline: true, lastSeen: new Date().toISOString() },
            { userId: 'user_2', username: 'Erik Johansson', role: 'admin', joinedAt: new Date().toISOString(), isOnline: false, lastSeen: new Date(Date.now() - 3600000).toISOString() },
            { userId: 'user_3', username: 'Maria Lindberg', role: 'member', joinedAt: new Date().toISOString(), isOnline: true, lastSeen: new Date().toISOString() },
          ],
          isPrivate: false,
          tags: ['ortopedi', 'läkarprogrammet', 'termin6'],
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'group_2',
          name: 'Trauma Bootcamp',
          description: 'Intensiv studiegrupp för ATLS och traumaomhändertagande. Fokus på praktiska scenarion.',
          createdBy: 'user_2',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          memberCount: 8,
          members: [
            { userId: 'user_2', username: 'Erik Johansson', role: 'owner', joinedAt: new Date().toISOString(), isOnline: false, lastSeen: new Date(Date.now() - 7200000).toISOString() },
          ],
          isPrivate: true,
          inviteCode: 'TRAUMA24',
          tags: ['trauma', 'ATLS', 'akut'],
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      myGroups: ['group_1'],
      activeGroupId: null,

      discussions: [
        {
          id: 'disc_1',
          groupId: 'group_1',
          title: 'Skillnad mellan öppen och sluten fraktur?',
          content: 'Kan någon förklara den praktiska skillnaden i handläggning mellan öppna och slutna frakturer? Jag förstår definitionen men är osäker på de kliniska implikationerna.',
          authorId: 'user_3',
          authorName: 'Maria Lindberg',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          replies: [
            {
              id: 'reply_1',
              content: 'Bra fråga! Den största skillnaden är infektionsrisken. Öppna frakturer kräver alltid:\n\n1. Antibiotika inom 3 timmar\n2. Tetanus-profylax\n3. Kirurgisk debridering\n4. Oftast extern fixation initialt\n\nSlutna frakturer har lägre infektionsrisk och kan ofta behandlas konservativt.',
              authorId: 'user_1',
              authorName: 'Anna Svensson',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              likes: 5,
              likedBy: ['user_2', 'user_3', 'user_4'],
              isAnswer: true,
            },
          ],
          likes: 3,
          likedBy: ['user_1', 'user_2'],
          isPinned: false,
          tags: ['frakturer', 'akut'],
        },
      ],

      sharedNotes: [
        {
          id: 'note_1',
          title: 'ABCDE-sammanfattning',
          content: '# Primary Survey - ABCDE\n\n## A - Airway\n- Kontrollera fri luftväg\n- C-spine stabilisering vid trauma\n- Jaw thrust om medvetslös\n\n## B - Breathing\n- Andningsfrekvens\n- Saturation\n- Auskultera båda lungfälten\n\n## C - Circulation\n- Puls och blodtryck\n- Kapillär återfyllnad\n- Blödningskontroll\n\n## D - Disability\n- GCS\n- Pupiller\n- Grovneurologiskt status\n\n## E - Exposure\n- Klä av patienten\n- Förhindra hypotermi',
          chapterId: 'chapter_1',
          chapterTitle: 'Trauma',
          authorId: 'user_1',
          authorName: 'Anna Svensson',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          sharedWith: 'public',
          likes: 15,
          likedBy: [],
          bookmarks: 8,
          bookmarkedBy: [],
          tags: ['ABCDE', 'trauma', 'akut'],
        },
      ],

      activityFeed: [],

      currentUserId: 'current_user',
      currentUserName: 'Du',

      // Group Actions
      createGroup: (groupData) => {
        const id = `group_${generateId()}`;
        const now = new Date().toISOString();
        const state = get();

        const newGroup: StudyGroup = {
          ...groupData,
          id,
          createdAt: now,
          memberCount: 1,
          members: [{
            userId: state.currentUserId,
            username: state.currentUserName,
            role: 'owner',
            joinedAt: now,
            isOnline: true,
            lastSeen: now,
          }],
          lastActivity: now,
        };

        set(s => ({
          groups: [newGroup, ...s.groups],
          myGroups: [...s.myGroups, id],
        }));

        return id;
      },

      joinGroup: (groupId) => {
        const state = get();
        const now = new Date().toISOString();

        set(s => ({
          groups: s.groups.map(g =>
            g.id === groupId
              ? {
                  ...g,
                  memberCount: g.memberCount + 1,
                  members: [
                    ...g.members,
                    {
                      userId: state.currentUserId,
                      username: state.currentUserName,
                      role: 'member' as const,
                      joinedAt: now,
                      isOnline: true,
                      lastSeen: now,
                    },
                  ],
                  lastActivity: now,
                }
              : g
          ),
          myGroups: [...s.myGroups, groupId],
        }));

        get().addActivity({
          type: 'join_group',
          userId: state.currentUserId,
          userName: state.currentUserName,
          data: { groupId, groupName: get().groups.find(g => g.id === groupId)?.name },
          groupId,
        });
      },

      leaveGroup: (groupId) => {
        const state = get();

        set(s => ({
          groups: s.groups.map(g =>
            g.id === groupId
              ? {
                  ...g,
                  memberCount: g.memberCount - 1,
                  members: g.members.filter(m => m.userId !== state.currentUserId),
                }
              : g
          ),
          myGroups: s.myGroups.filter(id => id !== groupId),
          activeGroupId: s.activeGroupId === groupId ? null : s.activeGroupId,
        }));
      },

      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

      updateGroup: (groupId, updates) => {
        set(s => ({
          groups: s.groups.map(g =>
            g.id === groupId ? { ...g, ...updates, lastActivity: new Date().toISOString() } : g
          ),
        }));
      },

      // Discussion Actions
      createDiscussion: (discussionData) => {
        const id = `disc_${generateId()}`;
        const now = new Date().toISOString();

        const newDiscussion: Discussion = {
          ...discussionData,
          id,
          createdAt: now,
          updatedAt: now,
          replies: [],
          likes: 0,
          likedBy: [],
        };

        set(s => ({
          discussions: [newDiscussion, ...s.discussions],
        }));

        if (discussionData.groupId) {
          get().addActivity({
            type: 'new_discussion',
            userId: discussionData.authorId,
            userName: discussionData.authorName,
            data: { discussionId: id, title: discussionData.title },
            groupId: discussionData.groupId,
          });
        }

        return id;
      },

      addReply: (discussionId, content) => {
        const state = get();
        const now = new Date().toISOString();

        const newReply: Reply = {
          id: `reply_${generateId()}`,
          content,
          authorId: state.currentUserId,
          authorName: state.currentUserName,
          createdAt: now,
          likes: 0,
          likedBy: [],
        };

        set(s => ({
          discussions: s.discussions.map(d =>
            d.id === discussionId
              ? { ...d, replies: [...d.replies, newReply], updatedAt: now }
              : d
          ),
        }));

        const discussion = get().discussions.find(d => d.id === discussionId);
        if (discussion?.groupId) {
          get().addActivity({
            type: 'reply',
            userId: state.currentUserId,
            userName: state.currentUserName,
            data: { discussionId, discussionTitle: discussion.title },
            groupId: discussion.groupId,
          });
        }
      },

      likeDiscussion: (discussionId) => {
        const state = get();

        set(s => ({
          discussions: s.discussions.map(d => {
            if (d.id !== discussionId) return d;
            const alreadyLiked = d.likedBy.includes(state.currentUserId);
            return {
              ...d,
              likes: alreadyLiked ? d.likes - 1 : d.likes + 1,
              likedBy: alreadyLiked
                ? d.likedBy.filter(id => id !== state.currentUserId)
                : [...d.likedBy, state.currentUserId],
            };
          }),
        }));
      },

      likeReply: (discussionId, replyId) => {
        const state = get();

        set(s => ({
          discussions: s.discussions.map(d => {
            if (d.id !== discussionId) return d;
            return {
              ...d,
              replies: d.replies.map(r => {
                if (r.id !== replyId) return r;
                const alreadyLiked = r.likedBy.includes(state.currentUserId);
                return {
                  ...r,
                  likes: alreadyLiked ? r.likes - 1 : r.likes + 1,
                  likedBy: alreadyLiked
                    ? r.likedBy.filter(id => id !== state.currentUserId)
                    : [...r.likedBy, state.currentUserId],
                };
              }),
            };
          }),
        }));
      },

      markAsAnswer: (discussionId, replyId) => {
        set(s => ({
          discussions: s.discussions.map(d => {
            if (d.id !== discussionId) return d;
            return {
              ...d,
              replies: d.replies.map(r => ({
                ...r,
                isAnswer: r.id === replyId,
              })),
            };
          }),
        }));
      },

      pinDiscussion: (discussionId) => {
        set(s => ({
          discussions: s.discussions.map(d =>
            d.id === discussionId ? { ...d, isPinned: !d.isPinned } : d
          ),
        }));
      },

      // Shared Notes Actions
      shareNote: (noteData) => {
        const id = `note_${generateId()}`;
        const now = new Date().toISOString();

        const newNote: SharedNote = {
          ...noteData,
          id,
          createdAt: now,
          updatedAt: now,
          likes: 0,
          likedBy: [],
          bookmarks: 0,
          bookmarkedBy: [],
        };

        set(s => ({
          sharedNotes: [newNote, ...s.sharedNotes],
        }));

        if (noteData.groupId) {
          get().addActivity({
            type: 'share_note',
            userId: noteData.authorId,
            userName: noteData.authorName,
            data: { noteId: id, noteTitle: noteData.title },
            groupId: noteData.groupId,
          });
        }

        return id;
      },

      likeNote: (noteId) => {
        const state = get();

        set(s => ({
          sharedNotes: s.sharedNotes.map(n => {
            if (n.id !== noteId) return n;
            const alreadyLiked = n.likedBy.includes(state.currentUserId);
            return {
              ...n,
              likes: alreadyLiked ? n.likes - 1 : n.likes + 1,
              likedBy: alreadyLiked
                ? n.likedBy.filter(id => id !== state.currentUserId)
                : [...n.likedBy, state.currentUserId],
            };
          }),
        }));
      },

      bookmarkNote: (noteId) => {
        const state = get();

        set(s => ({
          sharedNotes: s.sharedNotes.map(n => {
            if (n.id !== noteId) return n;
            const alreadyBookmarked = n.bookmarkedBy.includes(state.currentUserId);
            return {
              ...n,
              bookmarks: alreadyBookmarked ? n.bookmarks - 1 : n.bookmarks + 1,
              bookmarkedBy: alreadyBookmarked
                ? n.bookmarkedBy.filter(id => id !== state.currentUserId)
                : [...n.bookmarkedBy, state.currentUserId],
            };
          }),
        }));
      },

      // Activity Actions
      addActivity: (activityData) => {
        const id = `activity_${generateId()}`;

        set(s => ({
          activityFeed: [
            {
              ...activityData,
              id,
              timestamp: new Date().toISOString(),
            },
            ...s.activityFeed,
          ].slice(0, 100), // Keep last 100 activities
        }));
      },

      // Getters
      getGroupById: (id) => get().groups.find(g => g.id === id),

      getGroupDiscussions: (groupId) =>
        get().discussions.filter(d => d.groupId === groupId),

      getChapterDiscussions: (chapterId) =>
        get().discussions.filter(d => d.chapterId === chapterId),

      getGroupNotes: (groupId) =>
        get().sharedNotes.filter(n => n.groupId === groupId),

      getPublicNotes: (chapterId) =>
        get().sharedNotes.filter(n => n.chapterId === chapterId && n.sharedWith === 'public'),
    }),
    {
      name: 'bortim-social',
      partialize: (state) => ({
        groups: state.groups,
        myGroups: state.myGroups,
        discussions: state.discussions,
        sharedNotes: state.sharedNotes,
        activityFeed: state.activityFeed.slice(0, 20),
      }),
    }
  )
);
