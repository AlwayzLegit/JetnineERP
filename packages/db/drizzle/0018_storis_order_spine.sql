CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"window_start" time,
	"window_end" time,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"driver_membership_id" uuid,
	"route_position" integer,
	"notes" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "delivery_lines_quantity_positive" CHECK ("delivery_lines"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"qty_reserved" integer DEFAULT 0 NOT NULL,
	"qty_fulfilled" integer DEFAULT 0 NOT NULL,
	"line_type" text DEFAULT 'stock' NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"tax_rate_bps" integer DEFAULT 0 NOT NULL,
	"tax_class_id" uuid,
	"serial_unit_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_lines_quantity_positive" CHECK ("order_lines"."quantity" > 0),
	CONSTRAINT "order_lines_reserved_range" CHECK ("order_lines"."qty_reserved" >= 0 AND "order_lines"."qty_reserved" <= "order_lines"."quantity"),
	CONSTRAINT "order_lines_fulfilled_range" CHECK ("order_lines"."qty_fulfilled" >= 0 AND "order_lines"."qty_fulfilled" <= "order_lines"."quantity")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"number" text NOT NULL,
	"status" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"salesperson_membership_id" uuid,
	"second_salesperson_membership_id" uuid,
	"split_bps" integer,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"order_discount_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"deposit_required_cents" integer DEFAULT 0 NOT NULL,
	"fulfillment_type" text DEFAULT 'delivery' NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"address_city" text,
	"address_region" text,
	"address_postal_code" text,
	"address_phone" text,
	"requested_date" date,
	"notes" text,
	"internal_notes" text,
	"imported_at" timestamp with time zone,
	"legacy_number" text,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_split_bps_range" CHECK ("orders"."split_bps" IS NULL OR ("orders"."split_bps" >= 0 AND "orders"."split_bps" <= 10000))
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"entity" text NOT NULL,
	"source" text DEFAULT 'storis' NOT NULL,
	"filename" text,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"mapping_json" jsonb,
	"validation_json" jsonb,
	"row_count" integer DEFAULT 0 NOT NULL,
	"valid_row_count" integer DEFAULT 0 NOT NULL,
	"invalid_row_count" integer DEFAULT 0 NOT NULL,
	"committed_row_count" integer DEFAULT 0 NOT NULL,
	"uploaded_by_user_id" uuid,
	"validated_at" timestamp with time zone,
	"committed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"legacy_id" text,
	"raw_json" jsonb NOT NULL,
	"normalized_json" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"errors_json" jsonb,
	"jetnine_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"entity" text NOT NULL,
	"legacy_id" text NOT NULL,
	"jetnine_id" uuid NOT NULL,
	"source" text DEFAULT 'storis' NOT NULL,
	"import_batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "sale_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "kind" text DEFAULT 'sale' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "financing_provider" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "financing_ref" text;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_membership_id_memberships_id_fk" FOREIGN KEY ("driver_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_order_line_id_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_tax_class_id_tax_classes_id_fk" FOREIGN KEY ("tax_class_id") REFERENCES "public"."tax_classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_salesperson_membership_id_memberships_id_fk" FOREIGN KEY ("salesperson_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_second_salesperson_membership_id_memberships_id_fk" FOREIGN KEY ("second_salesperson_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_refs" ADD CONSTRAINT "legacy_refs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deliveries_business_id_idx" ON "deliveries" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "deliveries_order_id_idx" ON "deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "deliveries_location_scheduled_date_idx" ON "deliveries" USING btree ("location_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "deliveries_status_idx" ON "deliveries" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "deliveries_driver_membership_id_idx" ON "deliveries" USING btree ("driver_membership_id");--> statement-breakpoint
CREATE INDEX "delivery_lines_delivery_id_idx" ON "delivery_lines" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "delivery_lines_business_id_idx" ON "delivery_lines" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "delivery_lines_order_line_id_idx" ON "delivery_lines" USING btree ("order_line_id");--> statement-breakpoint
CREATE INDEX "order_lines_order_id_idx" ON "order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_lines_business_id_idx" ON "order_lines" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "order_lines_variant_id_idx" ON "order_lines" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "order_lines_business_line_type_idx" ON "order_lines" USING btree ("business_id","line_type");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_business_number_uniq" ON "orders" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX "orders_business_id_idx" ON "orders" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "orders_location_id_idx" ON "orders" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "orders_salesperson_membership_id_idx" ON "orders" USING btree ("salesperson_membership_id");--> statement-breakpoint
CREATE INDEX "orders_business_legacy_number_idx" ON "orders" USING btree ("business_id","legacy_number");--> statement-breakpoint
CREATE INDEX "import_batches_business_id_idx" ON "import_batches" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "import_batches_business_entity_idx" ON "import_batches" USING btree ("business_id","entity");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("business_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "import_rows_batch_row_number_uniq" ON "import_rows" USING btree ("batch_id","row_number");--> statement-breakpoint
CREATE INDEX "import_rows_business_id_idx" ON "import_rows" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "import_rows_batch_status_idx" ON "import_rows" USING btree ("batch_id","status");--> statement-breakpoint
CREATE INDEX "import_rows_batch_legacy_id_idx" ON "import_rows" USING btree ("batch_id","legacy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_refs_business_entity_legacy_uniq" ON "legacy_refs" USING btree ("business_id","entity","legacy_id");--> statement-breakpoint
CREATE INDEX "legacy_refs_business_entity_jetnine_idx" ON "legacy_refs" USING btree ("business_id","entity","jetnine_id");--> statement-breakpoint
CREATE INDEX "legacy_refs_business_id_idx" ON "legacy_refs" USING btree ("business_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_business_kind_idx" ON "payments" USING btree ("business_id","kind");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_parent_exactly_one" CHECK (num_nonnulls("payments"."sale_id", "payments"."order_id") = 1);