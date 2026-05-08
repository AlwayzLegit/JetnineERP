ALTER TABLE "businesses" ADD COLUMN "currency_code" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "default_tax_rate_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "receipt_header" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "receipt_footer" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "tax_rate_bps" integer;