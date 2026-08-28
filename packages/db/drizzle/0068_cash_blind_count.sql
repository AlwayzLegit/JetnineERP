ALTER TABLE "cash_shifts" ADD COLUMN "close_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD COLUMN "approved_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;