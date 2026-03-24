import type { Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { supervision } from '../db/schema';
import type { AuthRequest } from './auth';

export function guardianOf(paramKey: string = 'childUid') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const childUid = (req.params as any)?.[paramKey] as string | undefined;
    if (!req.user) return res.status(401).json({ error: 'No user' });
    if (!childUid) return res.status(400).json({ error: `Missing param: ${paramKey}` });

    const rows = await db
      .select({ id: supervision.id })
      .from(supervision)
      .where(and(eq(supervision.guardianUid, req.user.uid), eq(supervision.childUid, childUid)))
      .limit(1);

    if (rows.length === 0) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
