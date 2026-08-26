CREATE TABLE "order_return_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"return_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"per_unit_cents" integer NOT NULL,
	"reason_code_id" uuid,
	"reason" text,
	CONSTRAINT "order_return_lines_quantity_positive" CHECK ("order_return_lines"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"rma_number" text NOT NULL,
	"status" text DEFAULT 'authorized' NOT NULL,
	"fulfillment" text DEFAULT 'drop_off' NOT NULL,
	"refund_method" text DEFAULT 'original' NOT NULL,
	"amount_cents" integer NOT NULL,
	"reason" text,
	"created_by_user_id" uuid,
	"authorized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"goods_received_at" timestamp with time zone,
	"received_by_user_id" uuid,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_user_id" uuid,
	"cancel_reason" text
);
--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_return_id_order_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_order_line_id_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_return_lines" ADD CONSTRAINT "order_return_lines_reason_code_id_reason_codes_id_fk" FOREIGN KEY ("reason_code_id") REFERENCES "public"."reason_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_received_by_user_id_users_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_cancelled_by_user_id_users_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_return_lines_business_id_idx" ON "order_return_lines" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "order_return_lines_return_id_idx" ON "order_return_lines" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "order_return_lines_order_line_id_idx" ON "order_return_lines" USING btree ("order_line_id");--> statement-breakpoint
CREATE INDEX "order_returns_business_id_idx" ON "order_returns" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "order_returns_status_idx" ON "order_returns" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "order_returns_order_id_idx" ON "order_returns" USING btree ("order_id");