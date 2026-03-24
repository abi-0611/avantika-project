import { Router } from 'express';

import { requireAuth, type AuthRequest } from '../middleware/auth';
import { clearUserMemory, getMemory, toggleUserMemory } from '../services/ollamaService';

const router = Router();

router.get('/status', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
  const mem = getMemory(uid, conversationId);
  res.json({ enabled: mem.enabled, messageCount: mem.messages.length });
});

router.post('/toggle', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { enabled, conversationId } = req.body ?? {};
  toggleUserMemory(uid, Boolean(enabled), typeof conversationId === 'string' ? conversationId : undefined);
  res.json({ success: true, enabled: Boolean(enabled) });
});

router.delete('/', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
  clearUserMemory(uid, conversationId);
  res.json({ success: true });
});

export default router;
