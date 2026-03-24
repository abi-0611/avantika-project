export type RiskLevel = 'Safe' | 'Low' | 'Moderate' | 'High';

export interface ChatMessage {
  id?: string;
  uid: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  riskLevel: RiskLevel;
  riskCategory?: string;
  explanation?: string;
}

export interface SafetyRule {
  id?: string;
  keyword: string;
  category: string;
  riskLevel: RiskLevel;
}

export interface SafetyLog {
  id?: string;
  uid: string;
  timestamp: number;
  text: string;
  riskLevel: RiskLevel;
  riskCategory: string;
  escalated: boolean;
}

export interface SupervisionLink {
  id?: string;
  guardianUid: string;
  childUid: string;
  childEmail: string;
  status: 'pending' | 'active';
}

export interface ChildSettings {
  childUid: string;
  blockedKeywords: string[];
  blockedTopics: string[];
}
