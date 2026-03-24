import type { Request, Response, NextFunction } from 'express';
import * as jwtNs from 'jsonwebtoken';

const jwt: typeof jwtNs = ((jwtNs as any).default ?? jwtNs) as any;

export interface AuthRequest extends Request {
  user?: { uid: string; email: string; role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not set' });

  try {
    const payload = jwt.verify(token, secret) as any;
    req.user = { uid: payload.uid, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
