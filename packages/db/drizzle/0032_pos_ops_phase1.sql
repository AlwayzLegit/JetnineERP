CREATE TABLE "membership_permission_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"allowed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"next_value" integer DEFAULT 10001 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "ops_settings_json" jsonb;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "order_prefix" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "original_order_id" uuid;--> statement-breakpoint
ALTER TABLE "membership_permission_overrides" ADD CONSTRAINT "membership_permission_overrides_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_permission_overrides" ADD CONSTRAINT "membership_permission_overrides_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_sequences" ADD CONSTRAINT "order_sequences_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_sequences" ADD CONSTRAINT "order_sequences_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_permission_overrides_uniq" ON "membership_permission_overrides" USING btree ("membership_id","permission");--> statement-breakpoint
CREATE INDEX "membership_permission_overrides_business_idx" ON "membership_permission_overrides" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_sequences_location_uniq" ON "order_sequences" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "order_sequences_business_id_idx" ON "order_sequences" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_business_order_prefix_uniq" ON "locations" USING btree ("business_id","order_prefix");