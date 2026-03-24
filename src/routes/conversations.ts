import { Router } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { chats, conversations } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;

    // Using a LATERAL join to fetch the last message per conversation.
    const rows = await db.execute(sql`
      SELECT
        c.id,
        c.uid,
        c.title,
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        m.text as "lastMessageText",
        m.timestamp as "lastMessageTimestamp"
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT text, timestamp
        FROM chats
        WHERE chats.uid = c.uid AND chats.conversation_id = c.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) m ON true
      WHERE c.uid = ${uid}
      ORDER BY c.updated_at DESC
    `);

    const raw = (rows as any).rows ?? rows;
    const normalized = Array.isArray(raw)
      ? raw.map((r: any) => ({
          ...r,
          createdAt: typeof r.createdAt === 'string' ? Number(r.createdAt) : r.createdAt,
          updatedAt: typeof r.updatedAt === 'string' ? Number(r.updatedAt) : r.updatedAt,
          lastMessageTimestamp:
            r.lastMessageTimestamp == null
              ? null
              : typeof r.lastMessageTimestamp === 'string'
                ? Number(r.lastMessageTimestamp)
                : r.lastMessageTimestamp,
        }))
      : raw;

    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const { title } = req.body ?? {};

    const now = Date.now();
    const inserted = await db
      .insert(conversations)
      .values({
        uid,
        title: typeof title === 'string' && title.trim().length > 0 ? title.trim() : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    res.json(inserted[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const id = req.params.id;

    const rows = await db.select().from(conversations).where(and(eq(conversations.id, id as any), eq(conversations.uid, uid))).limit(1);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const id = req.params.id;
    const { title } = req.body ?? {};

    const nextTitleRaw = typeof title === 'string' ? title.trim() : '';
    const nextTitle = nextTitleRaw.length > 0 ? nextTitleRaw.slice(0, 80) : null;

    const updated = await db
      .update(conversations)
      .set({ title: nextTitle, updatedAt: Date.now() })
      .where(and(eq(conversations.id, id as any), eq(conversations.uid, uid)))
      .returning();

    if (!updated[0]) return res.status(404).json({ error: 'Not found' });
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const id = req.params.id;

    // Only allow deleting your own conversation.
    await db.delete(conversations).where(and(eq(conversations.id, id as any), eq(conversations.uid, uid)));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
