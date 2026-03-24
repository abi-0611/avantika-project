import { Router } from 'express';
import { and, eq, ne } from 'drizzle-orm';

import { db } from '../db';
import { chats, childSettings, conversations, logs, supervision, users } from '../db/schema';
import { adminOnly } from '../middleware/adminOnly';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth, adminOnly);

// Mock endpoint for "ML retraining" as requested in requirements
router.post('/retrain', async (_req: AuthRequest, res) => {
  res.json({ success: true, message: 'Safety models retrained successfully' });
});

router.get('/users', async (_req: AuthRequest, res, next) => {
  try {
    const rows = await db
      .select({
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:uid', async (req: AuthRequest, res, next) => {
  try {
    const uid = req.params.uid;
    const { email, displayName, role } = req.body ?? {};

    const allowedRoles = new Set(['user', 'parent', 'child', 'admin']);
    if (role !== undefined && !allowedRoles.has(String(role))) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (email !== undefined) {
      const existing = await db
        .select({ uid: users.uid })
        .from(users)
        .where(and(eq(users.email, String(email)), ne(users.uid, uid)))
        .limit(1);

      if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    }

    const update: Record<string, any> = {};
    if (email !== undefined) update.email = String(email);
    if (displayName !== undefined) update.displayName = displayName ? String(displayName) : null;
    if (role !== undefined) update.role = String(role);

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updated = await db
      .update(users)
      .set(update)
      .where(eq(users.uid, uid))
      .returning({ uid: users.uid, email: users.email, displayName: users.displayName, role: users.role, createdAt: users.createdAt });

    if (updated.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:uid', async (req: AuthRequest, res, next) => {
  try {
    const uid = req.params.uid;

    // Best-effort cleanup (even if DB cascade rules are missing/misaligned).
    await db.delete(chats).where(eq(chats.uid, uid));
    await db.delete(conversations).where(eq(conversations.uid, uid));
    await db.delete(logs).where(eq(logs.uid, uid));
    await db.delete(childSettings).where(eq(childSettings.childUid, uid));
    await db.delete(supervision).where(eq(supervision.guardianUid, uid));
    await db.delete(supervision).where(eq(supervision.childUid, uid));

    const deleted = await db.delete(users).where(eq(users.uid, uid)).returning({ uid: users.uid });
    if (deleted.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
