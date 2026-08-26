CREATE TABLE "daily_closeouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"close_date" text NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trigger" text DEFAULT 'scheduler' NOT NULL,
	"exception_count" integer DEFAULT 0 NOT NULL,
	"stock_released_count" integer DEFAULT 0 NOT NULL,
	"summary_json" jsonb
);
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_closeouts_business_id_idx" ON "daily_closeouts" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "daily_closeouts_date_idx" ON "daily_closeouts" USING btree ("business_id","close_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_closeouts_location_date_uniq" ON "daily_closeouts" USING btree ("location_id","close_date");