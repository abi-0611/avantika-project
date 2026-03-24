import { Router } from 'express';

import { requireAuth, type AuthRequest } from '../middleware/auth';
import { clearUserMemory, getMemory, toggleUserMemory } from '../services/ollamaService';

const router = Router();

router.get('/status', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const mem = getMemory(uid);
  res.json({ enabled: mem.enabled, messageCount: mem.messages.length });
});

router.post('/toggle', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { enabled } = req.body ?? {};
  toggleUserMemory(uid, Boolean(enabled));
  res.json({ success: true, enabled: Boolean(enabled) });
});

router.delete('/', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  clearUserMemory(uid);
  res.json({ success: true });
});

export default router;
