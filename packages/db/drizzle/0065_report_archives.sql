CREATE TABLE "report_archives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"report_definition_id" uuid,
	"report_name" text NOT NULL,
	"source_id" text NOT NULL,
	"access" text NOT NULL,
	"owner_user_id" uuid,
	"run_source" text DEFAULT 'regular' NOT NULL,
	"definition_snapshot_json" jsonb NOT NULL,
	"result_json" jsonb NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_archives" ADD CONSTRAINT "report_archives_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_archives" ADD CONSTRAINT "report_archives_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_archives_business_id_idx" ON "report_archives" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "report_archives_definition_idx" ON "report_archives" USING btree ("report_definition_id");--> statement-breakpoint
CREATE INDEX "report_archives_created_idx" ON "report_archives" USING btree ("business_id","created_at");