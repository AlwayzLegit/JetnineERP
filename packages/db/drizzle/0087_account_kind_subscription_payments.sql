CREATE TABLE "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"method" text NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"reference" text,
	"note" text,
	"recorded_by_user_id" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "account_kind" text DEFAULT 'saas' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_payments_business_id_idx" ON "subscription_payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_business_paid_at_idx" ON "subscription_payments" USING btree ("business_id","paid_at");