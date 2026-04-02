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

  getById: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await userRepository.getById(req.params.id);
      if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
      res.json(user);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  updateRole: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { role } = req.body;
      const targetId = req.params.id;
      const requesterId = req.user!.id;
      const requesterRole = req.user!.role;

      // Un admin ne peut pas changer son propre rôle
      if (targetId === requesterId) {
        res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
        return;
      }

      // Récupérer le rôle cible
      const target = await userRepository.getById(targetId);
      if (!target) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

      // Un ADMIN ne peut pas toucher un SUPER_ADMIN ni assigner SUPER_ADMIN
      if (requesterRole === 'ADMIN') {
        if (target.role === 'SUPER_ADMIN') {
          res.status(403).json({ error: 'Vous ne pouvez pas modifier le rôle d\'un super administrateur' });
          return;
        }
        if (role === 'SUPER_ADMIN') {
          res.status(403).json({ error: 'Vous ne pouvez pas assigner le rôle super administrateur' });
          return;
        }
      }

      // Un SUPER_ADMIN ne peut pas s'enlever lui-même de SUPER_ADMIN
      if (requesterRole === 'SUPER_ADMIN' && targetId === requesterId && role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Vous ne pouvez pas vous retirer du rôle super administrateur' });
        return;
      }

      res.json(await userRepository.updateRole(targetId, role));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  delete: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const target = await userRepository.getById(req.params.id);
      if (!target) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
      // Un ADMIN ne peut pas supprimer un SUPER_ADMIN
      if (req.user!.role === 'ADMIN' && target.role === 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Vous ne pouvez pas supprimer un super administrateur' });
        return;
      }
      await userRepository.softDelete(req.params.id);
      res.json({ message: 'Utilisateur supprimé (RGPD)' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },

  getDashboard: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await userRepository.getDashboardStats());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },

  getAnalytics: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await userRepository.getAnalytics());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
};
