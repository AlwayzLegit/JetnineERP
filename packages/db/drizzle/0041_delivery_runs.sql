CREATE TABLE "delivery_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"run_date" date NOT NULL,
	"route" text,
	"truck" text,
	"driver_membership_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"cod_due_cents" integer DEFAULT 0 NOT NULL,
	"cod_collected_cents" integer,
	"cod_received_by" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "run_id" uuid;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "failure_reason_code_id" uuid;--> statement-breakpoint
ALTER TABLE "delivery_runs" ADD CONSTRAINT "delivery_runs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_runs" ADD CONSTRAINT "delivery_runs_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_runs" ADD CONSTRAINT "delivery_runs_driver_membership_id_memberships_id_fk" FOREIGN KEY ("driver_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_runs" ADD CONSTRAINT "delivery_runs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_runs" ADD CONSTRAINT "delivery_runs_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_runs_business_id_idx" ON "delivery_runs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "delivery_runs_date_idx" ON "delivery_runs" USING btree ("business_id","run_date");--> statement-breakpoint
CREATE INDEX "delivery_runs_status_idx" ON "delivery_runs" USING btree ("business_id","status");--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_run_id_delivery_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."delivery_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_failure_reason_code_id_reason_codes_id_fk" FOREIGN KEY ("failure_reason_code_id") REFERENCES "public"."reason_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deliveries_run_id_idx" ON "deliveries" USING btree ("run_id");