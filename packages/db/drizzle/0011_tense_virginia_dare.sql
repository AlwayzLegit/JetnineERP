CREATE TABLE "tax_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rate_bps" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_class_id" uuid;--> statement-breakpoint
ALTER TABLE "tax_classes" ADD CONSTRAINT "tax_classes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_classes_business_name_uniq" ON "tax_classes" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "tax_classes_business_id_idx" ON "tax_classes" USING btree ("business_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tax_class_id_tax_classes_id_fk" FOREIGN KEY ("tax_class_id") REFERENCES "public"."tax_classes"("id") ON DELETE set null ON UPDATE no action;