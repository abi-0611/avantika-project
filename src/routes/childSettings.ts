import { Router } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { childSettings } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { guardianOf } from '../middleware/guardianOf';

const router = Router();

router.get('/:childUid', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const childUid = req.params.childUid;

    if (req.user!.uid !== childUid) {
      return guardianOf('childUid')(req, res, async () => {
        const rows = await db.select().from(childSettings).where(eq(childSettings.childUid, childUid)).limit(1);
        res.json(rows[0] ?? { childUid, blockedKeywords: [], blockedTopics: [] });
      });
    }

    const rows = await db.select().from(childSettings).where(eq(childSettings.childUid, childUid)).limit(1);
    res.json(rows[0] ?? { childUid, blockedKeywords: [], blockedTopics: [] });
  } catch (err) {
    next(err);
  }
});

router.put('/:childUid', requireAuth, guardianOf('childUid'), async (req: AuthRequest, res, next) => {
  try {
    const childUid = req.params.childUid;
    const { blockedKeywords, blockedTopics } = req.body ?? {};

    const nextKeywords = Array.isArray(blockedKeywords) ? blockedKeywords : [];
    const nextTopics = Array.isArray(blockedTopics) ? blockedTopics : [];

    const inserted = await db
      .insert(childSettings)
      .values({
        childUid,
        blockedKeywords: nextKeywords,
        blockedTopics: nextTopics,
      })
      .onConflictDoUpdate({
        target: childSettings.childUid,
        set: {
          blockedKeywords: nextKeywords,
          blockedTopics: nextTopics,
        },
      })
      .returning();

    res.json(inserted[0] ?? { success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
