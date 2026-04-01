import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/authRepository';

export const authService = {
  register: async (data: { email: string; password: string; firstName: string; lastName: string; city?: string }) => {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) throw new Error('Cet email est déjà utilisé');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await authRepository.createUser({ ...data, passwordHash });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    return { token, user: { id: user.id, email: user.email, role: user.role, userInfo: user.userInfo } };
  },

  login: async (email: string, password: string) => {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new Error('Email ou mot de passe incorrect');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Email ou mot de passe incorrect');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    return { token, user: { id: user.id, email: user.email, role: user.role, userInfo: user.userInfo } };
  },

  getMe: (id: string) => authRepository.findById(id),

  updateProfile: (userId: string, data: { firstName?: string; lastName?: string; city?: string }) =>
    authRepository.updateUserInfo(userId, data),

  deleteAccount: (id: string) => authRepository.softDelete(id),
};
