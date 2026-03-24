CREATE TYPE "public"."risk_level" AS ENUM('Safe', 'Low', 'Moderate', 'High');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'parent', 'child', 'admin');--> statement-breakpoint
CREATE TYPE "public"."link_status" AS ENUM('pending', 'active');--> statement-breakpoint
CREATE TABLE "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"conversation_id" uuid NOT NULL,
	"text" text NOT NULL,
	"sender" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"risk_level" "risk_level" DEFAULT 'Safe',
	"risk_category" text,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "child_settings" (
	"child_uid" text PRIMARY KEY NOT NULL,
	"blocked_keywords" text[] DEFAULT '{}',
	"blocked_topics" text[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uid" text NOT NULL,
	"title" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"text" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"risk_category" text NOT NULL,
	"escalated" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "safety_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"category" text NOT NULL,
	"risk_level" "risk_level" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervision" (
	"id" serial PRIMARY KEY NOT NULL,
	"guardian_uid" text NOT NULL,
	"child_uid" text NOT NULL,
	"child_email" text NOT NULL,
	"status" "link_status" DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"uid" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"role" "user_role" DEFAULT 'user',
	"created_at" bigint NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_settings" ADD CONSTRAINT "child_settings_child_uid_users_uid_fk" FOREIGN KEY ("child_uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision" ADD CONSTRAINT "supervision_guardian_uid_users_uid_fk" FOREIGN KEY ("guardian_uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision" ADD CONSTRAINT "supervision_child_uid_users_uid_fk" FOREIGN KEY ("child_uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;