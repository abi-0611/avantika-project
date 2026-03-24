import { Router } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { safetyRules } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

router.get('/', requireAuth, async (_req: AuthRequest, res, next) => {
  try {
    const rows = await db.select().from(safetyRules);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, adminOnly, async (req: AuthRequest, res, next) => {
  try {
    const { keyword, category, riskLevel } = req.body ?? {};
    if (!keyword || !category || !riskLevel) return res.status(400).json({ error: 'Missing keyword/category/riskLevel' });

    const inserted = await db
      .insert(safetyRules)
      .values({ keyword, category, riskLevel })
      .returning();

    res.json(inserted[0] ?? { success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, adminOnly, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    await db.delete(safetyRules).where(eq(safetyRules.id, id));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
