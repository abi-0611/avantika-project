import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';

import { db } from '../db';
import { chats } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { guardianOf } from '../middleware/guardianOf';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const rows = await db.select().from(chats).where(eq(chats.uid, uid)).orderBy(asc(chats.timestamp));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/child/:childUid', requireAuth, guardianOf('childUid'), async (req: AuthRequest, res, next) => {
  try {
    const childUid = req.params.childUid;
    const rows = await db.select().from(chats).where(eq(chats.uid, childUid)).orderBy(asc(chats.timestamp));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const { text, sender, timestamp, riskLevel, riskCategory, explanation } = req.body ?? {};
    if (!text || !sender) return res.status(400).json({ error: 'Missing text/sender' });

    const row = {
      uid,
      text,
      sender,
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
      riskLevel: riskLevel || 'Safe',
      riskCategory: riskCategory ?? null,
      explanation: explanation ?? null,
    };

    const inserted = await db.insert(chats).values(row).returning();
    res.json(inserted[0] ?? { success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    await db.delete(chats).where(eq(chats.uid, uid));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
