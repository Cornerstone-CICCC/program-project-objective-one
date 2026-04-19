export interface User {
  id: string;
  name: string;
  avatar: string;
  offering: string[];
  seeking: string[];
  location: { lat: number; lng: number };
  bio: string;
  matchPercentage?: number;
  isOnline?: boolean;
}

export interface Trade {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  offering: string;
  receiving: string;
  status: 'active' | 'pending' | 'completed';
  createdAt: Date;
}

export interface Message {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: boolean;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export const currentUser: User = {
  id: 'user-1',
  name: 'Morgan Rivers',
  avatar:
    'https://images.unsplash.com/photo-1683815251677-8df20f826622?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwZXJzb24lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2MDY0MDR8MA&ixlib=rb-4.1.0&q=80&w=200',
  offering: ['React Development', 'UI/UX Design', 'Photography'],
  seeking: ['Guitar Lessons', 'Spanish Tutoring', 'Carpentry'],
  location: { lat: 40.7128, lng: -74.006 },
  bio: 'Full-stack developer with a passion for clean design and learning new skills.',
};

export const nearbyUsers: User[] = [
  {
    id: 'user-2',
    name: 'Alex Chen',
    avatar:
      'https://images.unsplash.com/photo-1706025090794-7ade2c1b6208?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MTU0MzM3NHww&ixlib=rb-4.1.0&q=80&w=200',
    offering: ['Guitar Lessons', 'Music Production', 'Sound Design'],
    seeking: ['React Development', 'Web Design', 'Video Editing'],
    location: { lat: 40.7228, lng: -74.016 },
    bio: 'Musician and producer. Love teaching and collaborating.',
    matchPercentage: 98,
    isOnline: true,
  },
  {
    id: 'user-3',
    name: 'Sofia Martinez',
    avatar:
      'https://images.unsplash.com/photo-1752860872185-78926b52ef77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTYwNjE4MXww&ixlib=rb-4.1.0&q=80&w=200',
    offering: ['Spanish Tutoring', 'Yoga Instruction', 'Cooking Classes'],
    seeking: ['Photography', 'Graphic Design', 'Marketing'],
    location: { lat: 40.7328, lng: -74.026 },
    bio: 'Language teacher and wellness enthusiast.',
    matchPercentage: 85,
  },
  {
    id: 'user-4',
    name: 'Jordan Blake',
    avatar:
      'https://images.unsplash.com/photo-1618593706014-06782cd3bb3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNTIxNjM0fDA&ixlib=rb-4.1.0&q=80&w=200',
    offering: ['Carpentry', 'Home Repair', '3D Modeling'],
    seeking: ['UI/UX Design', 'App Development', 'Business Strategy'],
    location: { lat: 40.7028, lng: -73.996 },
    bio: 'Craftsman with an eye for detail.',
    matchPercentage: 72,
  },
  {
    id: 'user-5',
    name: 'Riley Park',
    avatar:
      'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTYwNzY4MHww&ixlib=rb-4.1.0&q=80&w=200',
    offering: ['Personal Training', 'Nutrition Coaching', 'Meditation'],
    seeking: ['Photography', 'Social Media', 'Content Writing'],
    location: { lat: 40.7428, lng: -74.036 },
    bio: 'Fitness coach helping people find balance.',
    matchPercentage: 65,
  },
];

export const activeTrades: Trade[] = [
  {
    id: 'trade-1',
    partnerId: 'user-2',
    partnerName: 'Alex Chen',
    partnerAvatar: nearbyUsers[0].avatar,
    offering: 'React Development',
    receiving: 'Guitar Lessons',
    status: 'active',
    createdAt: new Date('2026-02-15'),
  },
  {
    id: 'trade-2',
    partnerId: 'user-3',
    partnerName: 'Sofia Martinez',
    partnerAvatar: nearbyUsers[1].avatar,
    offering: 'Photography Session',
    receiving: 'Spanish Tutoring',
    status: 'active',
    createdAt: new Date('2026-02-12'),
  },
];

export const pendingTrades: Trade[] = [
  {
    id: 'trade-3',
    partnerId: 'user-4',
    partnerName: 'Jordan Blake',
    partnerAvatar: nearbyUsers[2].avatar,
    offering: 'UI/UX Design',
    receiving: 'Carpentry',
    status: 'pending',
    createdAt: new Date('2026-02-18'),
  },
];

export const completedTrades: Trade[] = [
  {
    id: 'trade-4',
    partnerId: 'user-5',
    partnerName: 'Riley Park',
    partnerAvatar: nearbyUsers[3].avatar,
    offering: 'Portrait Photography',
    receiving: 'Personal Training',
    status: 'completed',
    createdAt: new Date('2026-01-20'),
  },
];

export const messages: Message[] = [
  {
    id: 'msg-1',
    partnerId: 'user-2',
    partnerName: 'Alex Chen',
    partnerAvatar: nearbyUsers[0].avatar,
    lastMessage: "Sounds great! Let's start next Tuesday at 6pm.",
    timestamp: new Date('2026-02-20T10:30:00'),
    unread: true,
    unreadCount: 2,
  },
  {
    id: 'msg-2',
    partnerId: 'user-3',
    partnerName: 'Sofia Martinez',
    partnerAvatar: nearbyUsers[1].avatar,
    lastMessage: 'Thank you for the session! Looking forward to our next lesson.',
    timestamp: new Date('2026-02-19T14:20:00'),
    unread: false,
  },
  {
    id: 'msg-3',
    partnerId: 'user-4',
    partnerName: 'Jordan Blake',
    partnerAvatar: nearbyUsers[2].avatar,
    lastMessage: "I'm available this weekend for the shelf project.",
    timestamp: new Date('2026-02-18T09:15:00'),
    unread: true,
    unreadCount: 1,
  },
  {
    id: 'msg-4',
    partnerId: 'user-5',
    partnerName: 'Riley Park',
    partnerAvatar: nearbyUsers[3].avatar,
    lastMessage: 'Great photos! Can we schedule another session?',
    timestamp: new Date('2026-02-17T16:45:00'),
    unread: false,
  },
];

export const chatHistory: { [key: string]: ChatMessage[] } = {
  'user-2': [
    {
      id: 'chat-1',
      senderId: 'user-2',
      text: "Hey! I saw you're looking for guitar lessons. I'd love to help!",
      timestamp: new Date('2026-02-15T10:00:00'),
    },
    {
      id: 'chat-2',
      senderId: 'user-1',
      text: "That would be amazing! I've been wanting to learn for ages.",
      timestamp: new Date('2026-02-15T10:05:00'),
    },
    {
      id: 'chat-3',
      senderId: 'user-2',
      text: "Perfect! And I could really use help with React. What's your experience level?",
      timestamp: new Date('2026-02-15T10:10:00'),
    },
    {
      id: 'chat-4',
      senderId: 'user-1',
      text: "I've been developing with React for about 3 years. Can help with anything from basics to advanced patterns.",
      timestamp: new Date('2026-02-15T10:15:00'),
    },
    {
      id: 'chat-5',
      senderId: 'user-2',
      text: "Sounds great! Let's start next Tuesday at 6pm.",
      timestamp: new Date('2026-02-20T10:30:00'),
    },
  ],
};

export const popularSkills = [
  'React Development',
  'Guitar Lessons',
  'Photography',
  'Spanish Tutoring',
  'Yoga Instruction',
  'Carpentry',
  'Graphic Design',
  'Cooking Classes',
  'Personal Training',
  'Music Production',
  'UI/UX Design',
  'Video Editing',
];

// Skill Economy Data
export interface SkillDemand {
  skill: string;
  seeking: number;
  offering: number;
  trend: number; // percentage change this week
}

export interface NetworkStats {
  activeSwapsThisWeek: number;
  newNodesThisWeek: number;
  totalSkillsInCirculation: number;
}

export const networkStats: NetworkStats = {
  activeSwapsThisWeek: 142,
  newNodesThisWeek: 24,
  totalSkillsInCirculation: 850,
};

export const arbitrageOpportunities: SkillDemand[] = [
  {
    skill: '3D Modeling',
    seeking: 120,
    offering: 12,
    trend: 0,
  },
  {
    skill: 'Rust Programming',
    seeking: 89,
    offering: 8,
    trend: 0,
  },
  {
    skill: 'Motion Graphics',
    seeking: 76,
    offering: 9,
    trend: 0,
  },
];

export const trendingSkills: SkillDemand[] = [
  {
    skill: 'Rust Programming',
    seeking: 89,
    offering: 8,
    trend: 45,
  },
  {
    skill: 'Video Editing',
    seeking: 64,
    offering: 32,
    trend: 20,
  },
  {
    skill: 'AI Prompt Engineering',
    seeking: 58,
    offering: 15,
    trend: 67,
  },
  {
    skill: 'React Development',
    seeking: 95,
    offering: 48,
    trend: 12,
  },
];
