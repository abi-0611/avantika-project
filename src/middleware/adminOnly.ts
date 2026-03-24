import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}
