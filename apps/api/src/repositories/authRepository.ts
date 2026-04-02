import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const authRepository = {
  findByEmail: (email: string) =>
    prisma.user.findFirst({ where: { email, deletedAt: null }, include: { userInfo: true } }),

  createUser: (data: {
    email: string;
    passwordHash: string;
    role?: Role;
    firstName: string;
    lastName: string;
    city?: string;
  }) =>
    prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? Role.USER,
        userInfo: {
          create: { firstName: data.firstName, lastName: data.lastName, city: data.city },
        },
      },
      include: { userInfo: true },
    }),

  findById: (id: string) =>
    prisma.user.findFirst({ where: { id, deletedAt: null }, include: { userInfo: true } }),

  updateUserInfo: (userId: string, data: { firstName?: string; lastName?: string; city?: string }) =>
    prisma.userInfo.update({ where: { userId }, data }),

  updatePassword: (id: string, passwordHash: string) =>
    prisma.user.update({ where: { id }, data: { passwordHash } }),

  softDelete: (id: string) =>
    prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
};
