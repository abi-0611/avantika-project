import { Router } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { childSettings, logs, safetyRules } from '../db/schema';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { classifyImageRisk, classifyRisk, type SafetyResult } from '../services/ollamaService';

const router = Router();

async function logSafetyEvent(uid: string, text: string, result: SafetyResult) {
  if (result.riskLevel === 'Safe') return;

  await db.insert(logs).values({
    uid,
    text,
    timestamp: Date.now(),
    riskLevel: result.riskLevel,
    riskCategory: result.category || 'None',
    escalated: result.riskLevel === 'High',
  });
}

router.post('/classify', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const { text, imageBase64, imageText, conversationId } = req.body ?? {};
    const convId = typeof conversationId === 'string' && conversationId.trim().length > 0 ? conversationId.trim() : undefined;

    const rules = await db.select().from(safetyRules);
    const settingsRows = await db
      .select()
      .from(childSettings)
      .where(eq(childSettings.childUid, uid))
      .limit(1);

    const settings = settingsRows[0] ?? null;

    const inputText = typeof text === 'string' ? text : '';

    let result: SafetyResult;

    if (typeof imageBase64 === 'string' && imageBase64.trim().length > 0) {
      result = await classifyImageRisk(imageBase64, uid, convId, typeof imageText === 'string' ? imageText : inputText, settings);
    } else {
      result = await classifyRisk(inputText, uid, convId, rules as any, settings);
    }

    await logSafetyEvent(uid, inputText, result);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
