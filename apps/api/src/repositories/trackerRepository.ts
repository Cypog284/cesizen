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

  getStreak: async (userId: string): Promise<number> => {
    const entries = await prisma.trackerEntry.findMany({
      where: { userId },
      select: { loggedAt: true },
      orderBy: { loggedAt: 'desc' },
    });
    if (!entries.length) return 0;

    const days = [...new Set(entries.map(e => {
      const d = new Date(e.loggedAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))].sort((a, b) => b - a);

    const today = new Date();
    const todayTs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterday = todayTs - 86400000;

    // Streak commence seulement si aujourd'hui ou hier a une entrée
    if (days[0] !== todayTs && days[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i - 1] - days[i] === 86400000) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  getChart30Days: async (userId: string): Promise<{ date: string; count: number; avgIntensity: number }[]> => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);

    const entries = await prisma.trackerEntry.findMany({
      where: { userId, loggedAt: { gte: from } },
      select: { loggedAt: true, intensity: true },
    });

    // Construire un tableau des 30 derniers jours
    const result: { date: string; count: number; avgIntensity: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.loggedAt.toISOString().split('T')[0] === dateStr);
      const avg = dayEntries.length
        ? +(dayEntries.reduce((s, e) => s + e.intensity, 0) / dayEntries.length).toFixed(1)
        : 0;
      result.push({ date: dateStr, count: dayEntries.length, avgIntensity: avg });
    }
    return result;
  },
};
