import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const trackerRepository = {
  createEntry: (data: { userId: string; emotionId: string; intensity: number; comment?: string }) =>
    prisma.trackerEntry.create({
      data,
      include: { emotion: true },
    }),

  getEntriesByUser: (userId: string, limit = 50) =>
    prisma.trackerEntry.findMany({
      where: { userId },
      include: { emotion: true },
      orderBy: { loggedAt: 'desc' },
      take: limit,
    }),

  deleteEntry: (id: string, userId: string) =>
    prisma.trackerEntry.deleteMany({ where: { id, userId } }),

  getStats: async (userId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const entries = await prisma.trackerEntry.findMany({
      where: { userId, loggedAt: { gte: startOfMonth } },
      include: { emotion: true },
    });
    const totalIntensity = entries.reduce((acc, e) => acc + e.intensity, 0);
    const avgIntensity = entries.length ? +(totalIntensity / entries.length).toFixed(1) : 0;
    const emotionCount: Record<string, number> = {};
    entries.forEach(e => {
      emotionCount[e.emotion.label] = (emotionCount[e.emotion.label] || 0) + 1;
    });
    const dominant = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const activeDays = new Set(entries.map(e => e.loggedAt.toDateString())).size;
    return { totalEntries: entries.length, avgIntensity, dominantEmotion: dominant, activeDays, emotionCount };
  },
};
