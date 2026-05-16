CREATE TYPE "public"."chat_mode" AS ENUM('direct', 'group', 'local', 'world', 'webcam', 'random_cam', 'match_private');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_theme" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "share_location" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "mode" "chat_mode" DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "host_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_rooms_mode_idx" ON "chat_rooms" USING btree ("mode");--> statement-breakpoint
CREATE TABLE "matchmaking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"matched_user_id" uuid,
	"room_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matchmaking_sessions" ADD CONSTRAINT "matchmaking_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_sessions" ADD CONSTRAINT "matchmaking_sessions_matched_user_id_users_id_fk" FOREIGN KEY ("matched_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_sessions" ADD CONSTRAINT "matchmaking_sessions_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matchmaking_user_idx" ON "matchmaking_sessions" USING btree ("user_id");
