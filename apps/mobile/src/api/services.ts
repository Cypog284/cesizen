import api from './client';
import { AuthResponse, TrackerEntry, TrackerReport, PageInfo, Emotion, User, RegisterData } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data).then(r => r.data),
  getMe: () => api.get<User>('/auth/me').then(r => r.data),
  updateProfile: (data: { firstName?: string; lastName?: string; city?: string }) =>
    api.put('/auth/me', data).then(r => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/me/password', { currentPassword, newPassword }).then(r => r.data),
  deleteAccount: () => api.delete('/auth/me').then(r => r.data),
};

export const trackerApi = {
  addEntry: (data: { emotionId: string; intensity: number; comment?: string }) =>
    api.post<TrackerEntry>('/tracker', data).then(r => r.data),
  getHistory: () => api.get<TrackerEntry[]>('/tracker').then(r => r.data),
  deleteEntry: (id: string) => api.delete(`/tracker/${id}`).then(r => r.data),
  getReport: () => api.get<TrackerReport>('/tracker/report').then(r => r.data),
  getStreak: () => api.get<{ streak: number }>('/tracker/streak').then(r => r.data),
  getChart30Days: () => api.get<{ date: string; count: number; avgIntensity: number }[]>('/tracker/chart').then(r => r.data),
};

export const pagesApi = {
  getPublished: () => api.get<PageInfo[]>('/pages').then(r => r.data),
};

export const emotionsApi = {
  getAll: () => api.get<Emotion[]>('/emotions').then(r => r.data),
};
