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

  update: (id: string, data: Partial<{ label: string; color: string }>) =>
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

  updateRole: (id: string, role: 'USER' | 'ADMIN') =>
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
};
