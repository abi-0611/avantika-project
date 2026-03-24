// src/db/schema.ts
import { pgTable, serial, text, boolean, bigint, pgEnum, uuid } from 'drizzle-orm/pg-core';

export const riskLevelEnum = pgEnum('risk_level', ['Safe','Low','Moderate','High']);
export const roleEnum = pgEnum('user_role', ['user','parent','child','admin']);
export const statusEnum = pgEnum('link_status',['pending','active']);

export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  role: roleEnum('role').default('user'),
  createdAt: bigint('created_at', { mode:'number' }).notNull(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().references(()=>users.uid, {onDelete:'cascade'}),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  sender: text('sender').notNull(), // 'user' | 'bot'
  timestamp: bigint('timestamp', { mode:'number' }).notNull(),
  riskLevel: riskLevelEnum('risk_level').default('Safe'),
  riskCategory: text('risk_category'),
  explanation: text('explanation'),
});

export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().references(()=>users.uid, {onDelete:'cascade'}),
  text: text('text').notNull(),
  timestamp: bigint('timestamp', { mode:'number' }).notNull(),
  riskLevel: riskLevelEnum('risk_level').notNull(),
  riskCategory: text('risk_category').notNull(),
  escalated: boolean('escalated').default(false),
});

export const safetyRules = pgTable('safety_rules', {
  id: serial('id').primaryKey(),
  keyword: text('keyword').notNull(),
  category: text('category').notNull(),
  riskLevel: riskLevelEnum('risk_level').notNull(),
});

export const supervision = pgTable('supervision', {
  id: serial('id').primaryKey(),
  guardianUid: text('guardian_uid').notNull().references(()=>users.uid,{onDelete:'cascade'}),
  childUid: text('child_uid').notNull().references(()=>users.uid,{onDelete:'cascade'}),
  childEmail: text('child_email').notNull(),
  status: statusEnum('status').default('active'),
});

export const childSettings = pgTable('child_settings', {
  childUid: text('child_uid').primaryKey().references(()=>users.uid,{onDelete:'cascade'}),
  blockedKeywords: text('blocked_keywords').array().default([]),
  blockedTopics: text('blocked_topics').array().default([]),
});
