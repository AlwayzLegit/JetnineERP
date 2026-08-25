ALTER TABLE "orders" ADD COLUMN "public_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_public_token_uniq" ON "orders" USING btree ("public_token");