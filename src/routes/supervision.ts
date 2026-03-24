import { Router } from 'express';
import { and, eq } from 'drizzle-orm';

import { db } from '../db';
import { supervision, users } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const guardianUid = req.user!.uid;
    const rows = await db
      .select({
        id: supervision.id,
        guardianUid: supervision.guardianUid,
        childUid: supervision.childUid,
        childEmail: supervision.childEmail,
        status: supervision.status,
        childDisplayName: users.displayName,
        childUserEmail: users.email,
      })
      .from(supervision)
      .leftJoin(users, eq(supervision.childUid, users.uid))
      .where(eq(supervision.guardianUid, guardianUid));

    res.json(
      rows.map((r) => ({
        id: r.id,
        guardianUid: r.guardianUid,
        childUid: r.childUid,
        childEmail: r.childUserEmail ?? r.childEmail,
        status: r.status,
        childDisplayName: r.childDisplayName ?? null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const guardianUid = req.user!.uid;
    const { childEmail } = req.body ?? {};
    if (!childEmail) return res.status(400).json({ error: 'Missing childEmail' });

    const found = await db.select({ uid: users.uid, email: users.email }).from(users).where(eq(users.email, childEmail)).limit(1);
    if (found.length === 0) return res.status(404).json({ error: 'Child not found' });

    const childUid = found[0].uid;

    await db.insert(supervision).values({
      guardianUid,
      childUid,
      childEmail,
      status: 'active',
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:childUid', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const guardianUid = req.user!.uid;
    const childUid = req.params.childUid;

    await db
      .delete(supervision)
      .where(and(eq(supervision.guardianUid, guardianUid), eq(supervision.childUid, childUid)));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
