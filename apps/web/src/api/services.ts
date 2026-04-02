import api from './client';
import { AuthResponse, TrackerEntry, TrackerReport, PageInfo, Emotion, User, DashboardStats } from '../types';

// ── AUTH
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
  register: (data: { email: string; password: string; firstName: string; lastName: string; city?: string }) =>
    api.post<AuthResponse>('/auth/register', data).then(r => r.data),
  getMe: () => api.get<User>('/auth/me').then(r => r.data),
  updateProfile: (data: { firstName?: string; lastName?: string; city?: string }) =>
    api.put('/auth/me', data).then(r => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/me/password', { currentPassword, newPassword }).then(r => r.data),
  deleteAccount: () => api.delete('/auth/me').then(r => r.data),
};

// ── TRACKER
export const trackerApi = {
  addEntry: (data: { emotionId: string; intensity: number; comment?: string }) =>
    api.post<TrackerEntry>('/tracker', data).then(r => r.data),
  getHistory: () => api.get<TrackerEntry[]>('/tracker').then(r => r.data),
  deleteEntry: (id: string) => api.delete(`/tracker/${id}`).then(r => r.data),
  getReport: () => api.get<TrackerReport>('/tracker/report').then(r => r.data),
  getStreak: () => api.get<{ streak: number }>('/tracker/streak').then(r => r.data),
  getChart30Days: () => api.get<{ date: string; count: number; avgIntensity: number }[]>('/tracker/chart').then(r => r.data),
};

// ── PAGES
export const pagesApi = {
  getPublished: () => api.get<PageInfo[]>('/pages').then(r => r.data),
  getAll: () => api.get<PageInfo[]>('/pages/all').then(r => r.data),
  create: (data: { title: string; content: string; category: string }) =>
    api.post<PageInfo>('/pages', data).then(r => r.data),
  update: (id: string, data: Partial<PageInfo>) =>
    api.put<PageInfo>(`/pages/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/pages/${id}`).then(r => r.data),
};

// ── EMOTIONS
export const emotionsApi = {
  getAll: () => api.get<Emotion[]>('/emotions').then(r => r.data),
  getAllFlat: () => api.get<Emotion[]>('/emotions/flat').then(r => r.data),
  create: (data: { label: string; color: string; level: number; parentId?: string }) =>
    api.post<Emotion>('/emotions', data).then(r => r.data),
  update: (id: string, data: Partial<Emotion>) =>
    api.put<Emotion>(`/emotions/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/emotions/${id}`).then(r => r.data),
};

// ── ADMIN / USERS
export const adminApi = {
  getUsers: () => api.get<User[]>('/users').then(r => r.data),
  getDashboard: () => api.get<DashboardStats>('/users/dashboard').then(r => r.data),
  getAnalytics: () => api.get<any>('/users/analytics').then(r => r.data),
  getUserById: (id: string) => api.get<any>(`/users/${id}`).then(r => r.data),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }).then(r => r.data),
  deleteUser: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
};
