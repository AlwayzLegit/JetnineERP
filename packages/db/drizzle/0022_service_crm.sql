CREATE TABLE "customer_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"author_membership_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tag_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_order_id" uuid NOT NULL,
	"variant_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"kind" text DEFAULT 'labor' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_order_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_order_id" uuid NOT NULL,
	"author_membership_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"serial_unit_id" uuid,
	"item_description" text,
	"issue" text NOT NULL,
	"status" text DEFAULT 'intake' NOT NULL,
	"technician_membership_id" uuid,
	"warranty" boolean DEFAULT false NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"imported_at" timestamp with time zone,
	"legacy_number" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_parent_exactly_one";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "service_order_id" uuid;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_tag_id_customer_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."customer_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_lines" ADD CONSTRAINT "service_order_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_lines" ADD CONSTRAINT "service_order_lines_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_notes" ADD CONSTRAINT "service_order_notes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_notes" ADD CONSTRAINT "service_order_notes_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_technician_membership_id_memberships_id_fk" FOREIGN KEY ("technician_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_notes_customer_id_idx" ON "customer_notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_notes_business_id_idx" ON "customer_notes" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tag_links_customer_tag_uniq" ON "customer_tag_links" USING btree ("customer_id","tag_id");--> statement-breakpoint
CREATE INDEX "customer_tag_links_business_id_idx" ON "customer_tag_links" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "customer_tag_links_tag_id_idx" ON "customer_tag_links" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tags_business_name_uniq" ON "customer_tags" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "customer_tags_business_id_idx" ON "customer_tags" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "service_order_lines_service_order_id_idx" ON "service_order_lines" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX "service_order_lines_business_id_idx" ON "service_order_lines" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "service_order_notes_service_order_id_idx" ON "service_order_notes" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX "service_order_notes_business_id_idx" ON "service_order_notes" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_orders_business_number_uniq" ON "service_orders" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX "service_orders_business_id_idx" ON "service_orders" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "service_orders_status_idx" ON "service_orders" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "service_orders_customer_id_idx" ON "service_orders" USING btree ("customer_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_parent_exactly_one" CHECK (num_nonnulls("payments"."sale_id", "payments"."order_id", "payments"."service_order_id") = 1);