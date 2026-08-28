CREATE TABLE "stock_manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"from_location_id" uuid NOT NULL,
	"to_location_id" uuid NOT NULL,
	"number" text NOT NULL,
	"manifest_date" date NOT NULL,
	"route_name" text,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"created_by_user_id" uuid,
	"completed_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD COLUMN "manifest_id" uuid;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD COLUMN "load_number" integer;--> statement-breakpoint
ALTER TABLE "stock_manifests" ADD CONSTRAINT "stock_manifests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_manifests" ADD CONSTRAINT "stock_manifests_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_manifests" ADD CONSTRAINT "stock_manifests_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_manifests" ADD CONSTRAINT "stock_manifests_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_manifests_business_number_uniq" ON "stock_manifests" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX "stock_manifests_business_id_idx" ON "stock_manifests" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "stock_manifests_status_idx" ON "stock_manifests" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "stock_manifests_lane_idx" ON "stock_manifests" USING btree ("to_location_id","manifest_date");--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_manifest_id_stock_manifests_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."stock_manifests"("id") ON DELETE set null ON UPDATE no action;