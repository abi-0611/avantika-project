import { Router } from 'express';
import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '../db';
import { chats, conversations } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { guardianOf } from '../middleware/guardianOf';

const router = Router();

async function ensureConversationId(uid: string, requestedId?: string | null) {
  const id = typeof requestedId === 'string' && requestedId.trim().length > 0 ? requestedId.trim() : null;

  if (id) {
    const found = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, id as any), eq(conversations.uid, uid)))
      .limit(1);
    if (found[0]?.id) return found[0].id as any;
  }

  const latest = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.uid, uid))
    .orderBy(desc(conversations.updatedAt))
    .limit(1);
  if (latest[0]?.id) return latest[0].id as any;

  const now = Date.now();
  const inserted = await db
    .insert(conversations)
    .values({ uid, title: 'Conversation', createdAt: now, updatedAt: now })
    .returning({ id: conversations.id });

  return inserted[0].id;
}

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;

    const where = conversationId
      ? and(eq(chats.uid, uid), eq(chats.conversationId, conversationId as any))
      : eq(chats.uid, uid);

    const rows = await db.select().from(chats).where(where).orderBy(asc(chats.timestamp));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/child/:childUid', requireAuth, guardianOf('childUid'), async (req: AuthRequest, res, next) => {
  try {
    const childUid = req.params.childUid;
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const where = conversationId
      ? and(eq(chats.uid, childUid), eq(chats.conversationId, conversationId as any))
      : eq(chats.uid, childUid);

    const rows = await db.select().from(chats).where(where).orderBy(asc(chats.timestamp));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const { text, sender, timestamp, riskLevel, riskCategory, explanation, conversationId } = req.body ?? {};
    if (!text || !sender) return res.status(400).json({ error: 'Missing text/sender' });

    const convId = await ensureConversationId(uid, conversationId);

    const row = {
      uid,
      conversationId: convId,
      text,
      sender,
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
      riskLevel: riskLevel || 'Safe',
      riskCategory: riskCategory ?? null,
      explanation: explanation ?? null,
    };

    const inserted = await db.insert(chats).values(row).returning();

    // Update conversation metadata (updatedAt + set title on first user message).
    try {
      const now = Date.now();
      const update: any = { updatedAt: now };
      if (sender === 'user' && typeof text === 'string' && text.trim().length > 0) {
        const convRow = await db
          .select({ title: conversations.title })
          .from(conversations)
          .where(and(eq(conversations.id, convId as any), eq(conversations.uid, uid)))
          .limit(1);
        if (!convRow[0]?.title) update.title = text.trim().slice(0, 60);
      }

      await db.update(conversations).set(update).where(and(eq(conversations.id, convId as any), eq(conversations.uid, uid)));
    } catch {
      // Non-fatal.
    }

    res.json(inserted[0] ?? { success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const where = conversationId
      ? and(eq(chats.uid, uid), eq(chats.conversationId, conversationId as any))
      : eq(chats.uid, uid);

    await db.delete(chats).where(where);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
