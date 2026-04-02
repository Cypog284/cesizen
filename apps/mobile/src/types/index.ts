export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type PageCategory = 'PREVENTION' | 'EXERCISE' | 'INFORMATION';

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  city?: string;
  birthDate?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  userInfo: UserInfo | null;
}

export interface Emotion {
  id: string;
  label: string;
  level: number;
  color: string;
  parentId: string | null;
  children?: Emotion[];
}

export interface TrackerEntry {
  id: string;
  userId: string;
  emotionId: string;
  intensity: number;
  comment?: string;
  loggedAt: string;
  emotion: Emotion;
}

export interface TrackerReport {
  totalEntries: number;
  avgIntensity: number;
  dominantEmotion: string | null;
  activeDays: number;
  emotionCount: Record<string, number>;
}

export interface PageInfo {
  id: string;
  title: string;
  content: string;
  category: PageCategory;
  isPublished: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city?: string;
}
