import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { trackerService } from '../services/trackerService';

export const trackerController = {
  addEntry: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const entry = await trackerService.addEntry(req.user!.id, req.body);
      res.status(201).json(entry);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  getHistory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const entries = await trackerService.getHistory(req.user!.id);
      res.json(entries);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  deleteEntry: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await trackerService.deleteEntry(req.params.id, req.user!.id);
      res.json({ message: 'Entrée supprimée' });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  getReport: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stats = await trackerService.getReport(req.user!.id);
      res.json(stats);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
};
