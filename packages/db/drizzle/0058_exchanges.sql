CREATE TABLE "exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"number" text NOT NULL,
	"return_id" uuid NOT NULL,
	"sale_order_id" uuid NOT NULL,
	"original_order_id" uuid,
	"referenced_order_number" text,
	"status" text DEFAULT 'open' NOT NULL,
	"even_exchange" boolean DEFAULT false NOT NULL,
	"restocking_fee_cents" integer DEFAULT 0 NOT NULL,
	"restocking_fee_overridden" boolean DEFAULT false NOT NULL,
	"return_salesperson_membership_id" uuid,
	"notes" text,
	"created_by_user_id" uuid,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"split_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_return_id_order_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_returns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_sale_order_id_orders_id_fk" FOREIGN KEY ("sale_order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_original_order_id_orders_id_fk" FOREIGN KEY ("original_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_return_salesperson_membership_id_memberships_id_fk" FOREIGN KEY ("return_salesperson_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exchanges_business_number_uniq" ON "exchanges" USING btree ("business_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "exchanges_return_id_uniq" ON "exchanges" USING btree ("return_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exchanges_sale_order_id_uniq" ON "exchanges" USING btree ("sale_order_id");--> statement-breakpoint
CREATE INDEX "exchanges_business_id_idx" ON "exchanges" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "exchanges_status_idx" ON "exchanges" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "exchanges_original_order_id_idx" ON "exchanges" USING btree ("original_order_id");