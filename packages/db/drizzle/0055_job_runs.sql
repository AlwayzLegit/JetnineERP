CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"job_id" text NOT NULL,
	"business_date" date NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"records_affected" integer DEFAULT 0 NOT NULL,
	"detail_json" text,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_business_job_date_uniq" ON "job_runs" USING btree ("business_id","job_id","business_date");--> statement-breakpoint
CREATE INDEX "job_runs_business_id_idx" ON "job_runs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "job_runs_date_idx" ON "job_runs" USING btree ("business_id","business_date");