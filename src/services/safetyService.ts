import { GoogleGenAI, Type } from "@google/genai";
import { RiskLevel } from "../types";
import { collection, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "./errorService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface SafetyResult {
  riskLevel: RiskLevel;
  category: string;
  explanation: string;
  suggestedResponse: string;
}

async function getRules() {
  try {
    const querySnapshot = await getDocs(collection(db, "rules"));
    return querySnapshot.docs.map(doc => doc.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "rules");
    return [];
  }
}

async function getChildSettings(uid: string) {
  try {
    const docRef = doc(db, "childSettings", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `childSettings/${uid}`);
    return null;
  }
}

export async function classifyRisk(text: string, uid?: string): Promise<SafetyResult> {
  // 1. Rule-based keyword check
  const rules = await getRules();
  for (const rule of rules) {
    if (text.toLowerCase().includes(rule.keyword.toLowerCase())) {
      return {
        riskLevel: rule.riskLevel as RiskLevel,
        category: rule.category,
        explanation: `Flagged by keyword: ${rule.keyword}`,
        suggestedResponse: rule.riskLevel === 'High'
          ? "I'm really concerned about you right now. You're not alone 💙 Please call or text 988 (Suicide & Crisis Lifeline) — they're available 24/7."
          : "I noticed something in your message. Let's talk — what's going on?"
      };
    }
  }

  // 2. Child-specific parental filters
  if (uid) {
    const childSettings = await getChildSettings(uid);
    if (childSettings?.blockedKeywords) {
      for (const keyword of childSettings.blockedKeywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          return {
            riskLevel: 'Moderate',
            category: 'Parental Override',
            explanation: `Flagged by parental filter: ${keyword}`,
            suggestedResponse: "This topic has been restricted by your guardian for your safety. Let's chat about something else!"
          };
        }
      }
    }
  }

  // 3. Gemini — classify AND generate a real chat reply
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are ShieldBot, a warm and friendly AI companion for children aged 8-16.

For this message from a child, do TWO things:
1. Classify the safety risk level
2. Write a real, natural reply as a helpful chatbot friend

Child's message: "${text}"

RISK LEVEL RULES:
- "High" → self-harm, suicide, abuse, violence threats, crisis. Reply with empathy + always include: "Please call or text 988 (Suicide & Crisis Lifeline) anytime 💙"
- "Moderate" → bullying, distress, inappropriate topics. Reply with warmth and gentle redirection.
- "Low" → mild profanity, slightly off-topic. Reply normally with light guidance.
- "Safe" → normal chat, questions, homework, anything fine. Actually answer them helpfully and naturally.

IMPORTANT: suggestedResponse must ALWAYS be a real reply — never say "I'm here to help" generically. If they ask a question, answer it. If they say hi, greet them back warmly. If it's high risk, be empathetic and include 988.

Return ONLY this JSON (no markdown):
{
  "riskLevel": "Safe" | "Low" | "Moderate" | "High",
  "category": "e.g. Homework Help / Self-harm / Friendship / None",
  "explanation": "brief internal reason",
  "suggestedResponse": "your actual reply to the child"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            category: { type: Type.STRING },
            explanation: { type: Type.STRING },
            suggestedResponse: { type: Type.STRING }
          },
          required: ["riskLevel", "category", "explanation", "suggestedResponse"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    // Safety net: if suggestedResponse is missing or too generic, don't let it through
    if (!parsed.suggestedResponse || parsed.suggestedResponse.trim().length < 5) {
      parsed.suggestedResponse = parsed.riskLevel === 'High'
        ? "I'm really worried about you. Please call or text 988 anytime — you don't have to go through this alone 💙"
        : "I'm listening! Tell me more.";
    }

    return parsed as SafetyResult;
  } catch (e) {
    console.error("Gemini error:", e);
    // Return a meaningful fallback, not a vague error message
    return {
      riskLevel: "Safe",
      category: "None",
      explanation: "AI unavailable.",
      suggestedResponse: "Hey! I'm ShieldBot 👋 What's on your mind today?"
    };
  }
}

export async function classifyImageRisk(base64Image: string, uid?: string, text?: string): Promise<SafetyResult> {
  // Parental filter check first
  if (uid && text) {
    const childSettings = await getChildSettings(uid);
    if (childSettings?.blockedKeywords) {
      for (const keyword of childSettings.blockedKeywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          return {
            riskLevel: 'Moderate',
            category: 'Parental Override',
            explanation: `Flagged by parental filter: ${keyword}`,
            suggestedResponse: "This content has been restricted by your guardian. Let's chat about something else!"
          };
        }
      }
    }
  }

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
    },
  };

  const textPart = {
    text: `You are ShieldBot, a warm AI companion for children aged 8-16.

Analyze this image and the child's message, then:
1. Classify the safety risk
2. Write a natural, friendly reply

Child's message: "${text || "No text provided"}"

RISK LEVEL RULES:
- "High" → self-harm imagery, violence, explicit content. Reply with empathy + "Please call or text 988 anytime 💙"
- "Moderate" → concerning or inappropriate content. Gentle, caring redirection.
- "Low" → mildly off-topic content. Normal reply with light guidance.
- "Safe" → normal image. Engage naturally.

Return ONLY this JSON (no markdown):
{
  "riskLevel": "Safe" | "Low" | "Moderate" | "High",
  "category": "e.g. Artwork / Violence / None",
  "explanation": "brief internal reason",
  "suggestedResponse": "your actual reply to the child"
}`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            category: { type: Type.STRING },
            explanation: { type: Type.STRING },
            suggestedResponse: { type: Type.STRING }
          },
          required: ["riskLevel", "category", "explanation", "suggestedResponse"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    if (!parsed.suggestedResponse || parsed.suggestedResponse.trim().length < 5) {
      parsed.suggestedResponse = "Cool image! What would you like to talk about? 😊";
    }

    return parsed as SafetyResult;
  } catch (e) {
    console.error("Gemini image error:", e);
    return {
      riskLevel: "Safe",
      category: "None",
      explanation: "AI unavailable.",
      suggestedResponse: "I can see you shared an image! What's on your mind? 😊"
    };
  }
}

export async function logSafetyEvent(uid: string, text: string, result: SafetyResult) {
  if (result.riskLevel !== "Safe") {
    try {
      await addDoc(collection(db, "logs"), {
        uid,
        text,
        timestamp: Date.now(),
        riskLevel: result.riskLevel,
        riskCategory: result.category,
        escalated: result.riskLevel === "High"
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "logs");
    }
  }
}
