ALTER TABLE "order_return_lines" ALTER COLUMN "order_line_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_returns" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "order_returns" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "order_returns" ADD COLUMN "referenced_order_number" text;--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;