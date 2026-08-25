ALTER TABLE "integrations" ADD COLUMN "sync_status" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "sync_progress_json" jsonb;--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "sync_started_at" timestamp with time zone;