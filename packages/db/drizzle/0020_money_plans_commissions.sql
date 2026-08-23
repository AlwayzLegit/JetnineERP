CREATE TABLE "commission_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"order_id" uuid,
	"sale_id" uuid,
	"basis_cents" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"rate_bps" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"accrued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"basis" text NOT NULL,
	"rate_bps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_plan_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_payment_id" uuid,
	"status" text DEFAULT 'due' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"installment_amount_cents" integer NOT NULL,
	"frequency" text NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "commission_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_plans" ADD CONSTRAINT "commission_plans_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan_installments" ADD CONSTRAINT "payment_plan_installments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan_installments" ADD CONSTRAINT "payment_plan_installments_plan_id_payment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."payment_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan_installments" ADD CONSTRAINT "payment_plan_installments_paid_payment_id_payments_id_fk" FOREIGN KEY ("paid_payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commission_entries_business_id_idx" ON "commission_entries" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "commission_entries_membership_period_idx" ON "commission_entries" USING btree ("membership_id","period");--> statement-breakpoint
CREATE INDEX "commission_entries_status_idx" ON "commission_entries" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "commission_entries_order_id_idx" ON "commission_entries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "commission_entries_sale_id_idx" ON "commission_entries" USING btree ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_plans_business_name_uniq" ON "commission_plans" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "commission_plans_business_id_idx" ON "commission_plans" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plan_installments_plan_seq_uniq" ON "payment_plan_installments" USING btree ("plan_id","seq");--> statement-breakpoint
CREATE INDEX "payment_plan_installments_business_id_idx" ON "payment_plan_installments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "payment_plan_installments_due_idx" ON "payment_plan_installments" USING btree ("business_id","status","due_date");--> statement-breakpoint
CREATE INDEX "payment_plans_business_id_idx" ON "payment_plans" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plans_order_id_uniq" ON "payment_plans" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_plans_status_idx" ON "payment_plans" USING btree ("business_id","status");