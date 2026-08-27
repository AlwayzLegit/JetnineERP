DROP INDEX "exchanges_return_id_uniq";--> statement-breakpoint
DROP INDEX "exchanges_sale_order_id_uniq";--> statement-breakpoint
CREATE UNIQUE INDEX "exchanges_return_id_uniq" ON "exchanges" USING btree ("return_id") WHERE "exchanges"."status" not in ('split', 'cancelled');--> statement-breakpoint
CREATE UNIQUE INDEX "exchanges_sale_order_id_uniq" ON "exchanges" USING btree ("sale_order_id") WHERE "exchanges"."status" not in ('split', 'cancelled');