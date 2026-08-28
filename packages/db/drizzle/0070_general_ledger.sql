CREATE TABLE "gl_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"system_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gl_journal_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"batch_type" text DEFAULT 'manual' NOT NULL,
	"source_type" text,
	"source_id" uuid,
	"business_date" date NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period" integer NOT NULL,
	"memo" text,
	"created_by_user_id" uuid,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gl_journal_batches_derived_source_chk" CHECK (batch_type <> 'derived' OR (source_type IS NOT NULL AND source_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "gl_journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"memo" text,
	"debit_cents" integer DEFAULT 0 NOT NULL,
	"credit_cents" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "gl_journal_lines_one_sided_chk" CHECK ((debit_cents > 0 AND credit_cents = 0) OR (credit_cents > 0 AND debit_cents = 0))
);
--> statement-breakpoint
CREATE TABLE "gl_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by_user_id" uuid,
	CONSTRAINT "gl_periods_period_range" CHECK ("gl_periods"."period" BETWEEN 1 AND 13)
);
--> statement-breakpoint
ALTER TABLE "gl_accounts" ADD CONSTRAINT "gl_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_journal_batches" ADD CONSTRAINT "gl_journal_batches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_journal_batches" ADD CONSTRAINT "gl_journal_batches_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_batch_id_gl_journal_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."gl_journal_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_account_id_gl_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."gl_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_periods" ADD CONSTRAINT "gl_periods_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_periods" ADD CONSTRAINT "gl_periods_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gl_accounts_business_code_uniq" ON "gl_accounts" USING btree ("business_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "gl_accounts_business_system_key_uniq" ON "gl_accounts" USING btree ("business_id","system_key");--> statement-breakpoint
CREATE INDEX "gl_accounts_business_id_idx" ON "gl_accounts" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gl_journal_batches_business_number_uniq" ON "gl_journal_batches" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX "gl_journal_batches_business_id_idx" ON "gl_journal_batches" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "gl_journal_batches_status_idx" ON "gl_journal_batches" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "gl_journal_batches_period_idx" ON "gl_journal_batches" USING btree ("business_id","fiscal_year","period");--> statement-breakpoint
CREATE INDEX "gl_journal_batches_source_idx" ON "gl_journal_batches" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "gl_journal_lines_batch_id_idx" ON "gl_journal_lines" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "gl_journal_lines_account_id_idx" ON "gl_journal_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "gl_journal_lines_business_id_idx" ON "gl_journal_lines" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gl_periods_business_year_period_uniq" ON "gl_periods" USING btree ("business_id","fiscal_year","period");--> statement-breakpoint
CREATE INDEX "gl_periods_business_id_idx" ON "gl_periods" USING btree ("business_id");