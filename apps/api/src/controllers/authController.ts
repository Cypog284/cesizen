import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  city: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      res.json(result);
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  },

  getMe: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await authService.getMe(req.user!.id);
      res.json(user);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  updateProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const updated = await authService.updateProfile(req.user!.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  deleteAccount: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await authService.deleteAccount(req.user!.id);
      res.json({ message: 'Compte supprimé (RGPD - soft delete)' });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
};
