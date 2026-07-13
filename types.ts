
export enum IdentityType {
  REAL = 'REAL',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum UserPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export enum UserStatus {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  AWAY = 'AWAY',
  INVISIBLE = 'INVISIBLE',
  OFFLINE = 'OFFLINE'
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  age: number;
  birthDate: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro' | 'Não informar';
  identityType: IdentityType;
  reputation: number;
  level: number;
  xp: number;
  verified: boolean;
  plan: UserPlan;
  bio: string;
  avatar: string;
  coverImage?: string;
  location: string;
  relationship?: string;
  education?: string;
  occupation?: string;
  languages?: string;
  interests?: string;
  friends: string[];
  bookmarks: string[];
  joinedCommunities: string[];
  friendRequests: { fromId: string; timestamp: string }[];
  wishlist?: string[];
  privacy: {
    isPublic: boolean;
    showLocation: boolean;
    allowStrangersMsg: boolean;
    showOnlineStatus: boolean;
    incognitoMode?: boolean;
    blockedKeywords?: string[];
  };
  pushNotificationsEnabled?: boolean;
  status: UserStatus;
  statusPhrase?: string;
  currentMusic?: string;
  currentMood?: string;
  ultima_atividade: number; 
  createdAt?: string;
  themePreference?: 'dark' | 'light' | 'nostalgia';
  animatedAvatar?: boolean;
}

export type PlotStatus = 'locked' | 'empty' | 'planted' | 'growing' | 'ready';

export interface AgroPlot {
  id: number;
  cropId: string | null;
  plantedAt: number | null;
  status: PlotStatus;
  quality: number;
}

export interface AgroPen {
  id: number;
  animalId: string | null;
  startedAt: number | null;
  status: 'locked' | 'empty' | 'active' | 'ready';
}

export interface AgroGameState {
  credits: number;
  level: number;
  xp: number;
  water: number;
  wellLevel: number; 
  plots: AgroPlot[];
  pens: AgroPen[];
  inventory: Record<string, number>;
  lastCheck: number;
  unlockedMachines: string[]; // IDs do maquinário desbloqueado
}

export interface AgroCrop {
  id: string;
  name: string;
  emoji: string;
  growthTime: number; 
  cost: number;
  waterNeed: number;
  baseYield: number;
  xp: number;
  minLevel: number;
}

export interface AgroAnimal {
  id: string;
  name: string;
  emoji: string;
  productionTime: number;
  cost: number;
  baseYield: number;
  xp: number;
  product: string;
  minLevel: number;
}

export interface AgroMachine {
  id: string;
  name: string;
  description: string;
  cost: number;
  minLevel: number;
  bonusType: 'yield' | 'time' | 'quality';
  bonusValue: number;
}

// Added missing notification interface used in App.tsx
export interface AppNotification {
  id: string;
  message: string;
  senderAvatar: string;
  timestamp: string;
  read: boolean;
}

// Added missing comment interface used in FeedView.tsx
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likedBy: string[];
  replies: Comment[];
}

// Added missing post interface used in FeedView.tsx
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorIdentity: IdentityType;
  type: 'text' | 'video';
  content: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  lovedBy: string[];
  comments: Comment[];
  communityId?: string;
  communityName?: string;
}

// Added missing story interface used in FeedView.tsx
export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userIdentity: IdentityType;
  content: string;
  color: string;
  timestamp: number;
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
}

// Added missing community interface used in CommunitiesView.tsx
export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  ownerId: string;
  members: string[];
  ranking: number;
  isPrivate: boolean;
  isPremium: boolean;
  createdAt: number;
}

// Added missing participant interface used in ChatView.tsx
export interface Participant {
  user_id: string;
}

// Added missing conversation interface used in ChatView.tsx
export interface Conversation {
  id: string;
  participantes: Participant[];
  lastMessage: string;
}

// Added missing message interface used in ChatView.tsx
export interface Message {
  id: string;
  conversa_id: string;
  remetente_id: string;
  tipo: 'texto' | 'nudge' | 'imagem' | 'video' | 'audio';
  conteudo: string;
  data_envio: number;
  lida: boolean;
  editada: boolean;
}

// Added missing product interface used in MarketplaceView.tsx
export interface Product {
  id: string;
  name: string;
  price: number;
  location: string;
  category: string;
  image: string;
  sellerId: string;
  sellerName: string;
  status: 'active' | 'sold';
  condition: 'Novo' | 'Usado - Excelente' | 'Usado - Bom' | 'Usado - Razoável';
  description: string;
  views: number;
  createdAt: number;
}

// Added missing market price interface used in services/db.ts
export interface MarketPrice {
  id: string;
  price: number;
  trend: 'up' | 'down';
}

export interface SharedLocation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
  targetType: 'friends' | 'community';
  targetId?: string; // ID da comunidade se targetType for 'community'
  statusText?: string;
  incognito?: boolean;
}

