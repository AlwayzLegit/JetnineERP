CREATE TABLE "cost_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"layer_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost_cents" integer NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" uuid,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cost_consumptions_quantity_positive" CHECK ("cost_consumptions"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "cost_layers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"reference_id" uuid,
	"unit_cost_cents" integer NOT NULL,
	"quantity_received" integer NOT NULL,
	"quantity_remaining" integer NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cost_layers_quantity_positive" CHECK ("cost_layers"."quantity_received" > 0),
	CONSTRAINT "cost_layers_remaining_bounds" CHECK ("cost_layers"."quantity_remaining" >= 0 AND "cost_layers"."quantity_remaining" <= "cost_layers"."quantity_received")
);
--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD COLUMN "unit_cost_cents" integer;--> statement-breakpoint
ALTER TABLE "cost_consumptions" ADD CONSTRAINT "cost_consumptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_consumptions" ADD CONSTRAINT "cost_consumptions_layer_id_cost_layers_id_fk" FOREIGN KEY ("layer_id") REFERENCES "public"."cost_layers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_layers" ADD CONSTRAINT "cost_layers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cost_consumptions_business_id_idx" ON "cost_consumptions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "cost_consumptions_layer_id_idx" ON "cost_consumptions" USING btree ("layer_id");--> statement-breakpoint
CREATE INDEX "cost_consumptions_reference_idx" ON "cost_consumptions" USING btree ("business_id","reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "cost_layers_business_id_idx" ON "cost_layers" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "cost_layers_fifo_idx" ON "cost_layers" USING btree ("variant_id","location_id","received_at");