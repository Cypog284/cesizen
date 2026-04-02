import { PrismaClient, PageCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ── PAGE REPOSITORY
export const pageRepository = {
  getPublished: () =>
    prisma.pageInfo.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } }),

  getAll: () =>
    prisma.pageInfo.findMany({ include: { author: { select: { email: true } } }, orderBy: { createdAt: 'desc' } }),

  getById: (id: string) => prisma.pageInfo.findUnique({ where: { id } }),

  create: (data: { title: string; content: string; category: PageCategory; authorId: string }) =>
    prisma.pageInfo.create({ data }),

  update: (id: string, data: Partial<{ title: string; content: string; category: PageCategory; isPublished: boolean }>) =>
    prisma.pageInfo.update({ where: { id }, data }),

  delete: (id: string) => prisma.pageInfo.delete({ where: { id } }),
};

// ── EMOTION REPOSITORY
export const emotionRepository = {
  getAll: () =>
    prisma.emotion.findMany({
      where: { level: 1 },
      include: { children: true },
      orderBy: { label: 'asc' },
    }),

  getAllFlat: () => prisma.emotion.findMany({ orderBy: { level: 'asc' } }),

  create: (data: { label: string; color: string; level: number; parentId?: string }) =>
    prisma.emotion.create({ data }),

  update: (id: string, data: Partial<{ label: string; color: string; level: number; parentId: string | null }>) =>
    prisma.emotion.update({ where: { id }, data }),

  delete: (id: string) => prisma.emotion.delete({ where: { id } }),
};

// ── USER REPOSITORY (admin)
export const userRepository = {
  getAll: () =>
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { userInfo: true },
      orderBy: { createdAt: 'desc' },
    }),

  getById: (id: string) =>
    prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userInfo: true,
        _count: { select: { trackerEntries: true } },
      },
    }),

  updateRole: (id: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') =>
    prisma.user.update({ where: { id }, data: { role } }),

  softDelete: (id: string) =>
    prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),

  getDashboardStats: async () => {
    const [users, pages, emotions, entries] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.pageInfo.count({ where: { isPublished: true } }),
      prisma.emotion.count(),
      prisma.trackerEntry.count(),
    ]);
    return { users, pages, emotions, entries };
  },

  getAnalytics: async () => {
    // Inscriptions sur les 30 derniers jours
    const now = new Date();
    const registrations: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const start = new Date(dateStr);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await prisma.user.count({
        where: { createdAt: { gte: start, lt: end }, deletedAt: null },
      });
      registrations.push({ date: dateStr, count });
    }

    // Répartition globale des émotions (top 10)
    const emotionStats = await prisma.trackerEntry.groupBy({
      by: ['emotionId'],
      _count: { emotionId: true },
      orderBy: { _count: { emotionId: 'desc' } },
      take: 10,
    });
    const emotionIds = emotionStats.map(e => e.emotionId);
    const emotions = await prisma.emotion.findMany({ where: { id: { in: emotionIds } } });
    const emotionMap = Object.fromEntries(emotions.map(e => [e.id, e]));
    const topEmotions = emotionStats.map(e => ({
      label: emotionMap[e.emotionId]?.label ?? 'Inconnu',
      color: emotionMap[e.emotionId]?.color ?? '#ccc',
      count: e._count.emotionId,
    }));

    // Intensité moyenne globale
    const intensityAgg = await prisma.trackerEntry.aggregate({ _avg: { intensity: true } });
    const avgIntensity = +(intensityAgg._avg.intensity ?? 0).toFixed(1);

    return { registrations, topEmotions, avgIntensity };
  },
};
