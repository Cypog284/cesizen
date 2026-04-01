import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pageRepository, emotionRepository, userRepository } from '../repositories/cesizentRepository';

// ── PAGE CONTROLLER
export const pageController = {
  getPublished: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await pageRepository.getPublished());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  getAll: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await pageRepository.getAll());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  create: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = await pageRepository.create({ ...req.body, authorId: req.user!.id });
      res.status(201).json(page);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await pageRepository.update(req.params.id, req.body));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      await pageRepository.delete(req.params.id);
      res.json({ message: 'Page supprimée' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
};

// ── EMOTION CONTROLLER
export const emotionController = {
  getAll: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await emotionRepository.getAll());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  getAllFlat: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await emotionRepository.getAllFlat());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(201).json(await emotionRepository.create(req.body));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await emotionRepository.update(req.params.id, req.body));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      await emotionRepository.delete(req.params.id);
      res.json({ message: 'Émotion supprimée' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
};

// ── USER CONTROLLER (admin)
export const userController = {
  getAll: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await userRepository.getAll());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  updateRole: async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await userRepository.updateRole(req.params.id, req.body.role));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      await userRepository.softDelete(req.params.id);
      res.json({ message: 'Utilisateur supprimé (RGPD)' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  getDashboard: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await userRepository.getDashboardStats());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
};
