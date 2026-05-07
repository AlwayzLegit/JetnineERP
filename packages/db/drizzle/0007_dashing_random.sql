CREATE TABLE "merchant_stripe_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"stripe_account_id" text NOT NULL,
	"scope" text NOT NULL,
	"livemode" boolean NOT NULL,
	"account_email" text,
	"default_currency" text,
	"charges_enabled" boolean DEFAULT false NOT NULL,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"connected_by_user_id" uuid,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disconnected_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stripe_oauth_states" (
	"state" text PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchant_stripe_accounts" ADD CONSTRAINT "merchant_stripe_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_stripe_accounts" ADD CONSTRAINT "merchant_stripe_accounts_connected_by_user_id_users_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_oauth_states" ADD CONSTRAINT "stripe_oauth_states_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_oauth_states" ADD CONSTRAINT "stripe_oauth_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_stripe_accounts_business_id_uniq" ON "merchant_stripe_accounts" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "merchant_stripe_accounts_stripe_id_idx" ON "merchant_stripe_accounts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "stripe_oauth_states_business_id_idx" ON "stripe_oauth_states" USING btree ("business_id");