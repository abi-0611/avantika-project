import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as jwtNs from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '../db';
import { users, chats, logs } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

const jwt: typeof jwtNs = ((jwtNs as any).default ?? jwtNs) as any;

function signToken(payload: { uid: string; email: string; role: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwtNs.SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName, role } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });

    const existing = await db.select({ uid: users.uid }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const uid = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = Date.now();

    await db.insert(users).values({
      uid,
      email,
      passwordHash,
      displayName: displayName || null,
      role: role || 'user',
      createdAt,
    });

    const token = signToken({ uid, email, role: role || 'user' });

    res.json({
      token,
      user: { uid, email, displayName: displayName || null, role: role || 'user', createdAt },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });

    const rows = await db
      .select({
        uid: users.uid,
        email: users.email,
        passwordHash: users.passwordHash,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ uid: user.uid, email: user.email, role: (user.role as any) || 'user' });

    res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName ?? null,
        role: user.role ?? 'user',
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;

    const rows = await db
      .select({ uid: users.uid, email: users.email, displayName: users.displayName, role: users.role, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/profile', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const { displayName } = req.body ?? {};

    await db.update(users).set({ displayName: displayName ?? null }).where(eq(users.uid, uid));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/account', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;

    await db.delete(chats).where(eq(chats.uid, uid));
    await db.delete(logs).where(eq(logs.uid, uid));
    await db.delete(users).where(eq(users.uid, uid));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
