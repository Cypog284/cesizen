import { trackerRepository } from '../repositories/trackerRepository';

export const trackerService = {
  addEntry: (userId: string, data: { emotionId: string; intensity: number; comment?: string }) => {
    if (data.intensity < 1 || data.intensity > 5) throw new Error("L'intensité doit être entre 1 et 5");
    return trackerRepository.createEntry({ userId, ...data });
  },

  getHistory: (userId: string) => trackerRepository.getEntriesByUser(userId),

  deleteEntry: (id: string, userId: string) => trackerRepository.deleteEntry(id, userId),

  getReport: (userId: string) => trackerRepository.getStats(userId),
  getStreak: (userId: string) => trackerRepository.getStreak(userId),
  getChart30Days: (userId: string) => trackerRepository.getChart30Days(userId),
};
