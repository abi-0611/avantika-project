import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';

import { db } from '../db';
import { logs } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { guardianOf } from '../middleware/guardianOf';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const limitCount = Number.isFinite(limitParam) && (limitParam as number) > 0 ? (limitParam as number) : undefined;

    // For admin users, return all logs (monitoring dashboard)
    const base = req.user!.role === 'admin'
      ? db.select().from(logs)
      : db.select().from(logs).where(eq(logs.uid, uid));

    const q = base.orderBy(desc(logs.timestamp));
    const rows = limitCount ? await q.limit(limitCount) : await q;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const { text, riskLevel, riskCategory, escalated, timestamp } = req.body ?? {};
    if (!text || !riskLevel || !riskCategory) return res.status(400).json({ error: 'Missing text/riskLevel/riskCategory' });

    const inserted = await db
      .insert(logs)
      .values({
        uid,
        text,
        timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
        riskLevel,
        riskCategory,
        escalated: typeof escalated === 'boolean' ? escalated : false,
      })
      .returning();

    res.json(inserted[0] ?? { success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/child/:childUid', requireAuth, guardianOf('childUid'), async (req: AuthRequest, res, next) => {
  try {
    const childUid = req.params.childUid;
    const rows = await db.select().from(logs).where(eq(logs.uid, childUid)).orderBy(desc(logs.timestamp));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
