CREATE TABLE "reason_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"usage_class" text NOT NULL,
	"is_restricted" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"authorizing_user_id" uuid,
	"permission" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"reason_code_id" uuid,
	"reason" text,
	"before_json" jsonb,
	"after_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reason_codes" ADD CONSTRAINT "reason_codes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_overrides" ADD CONSTRAINT "security_overrides_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_overrides" ADD CONSTRAINT "security_overrides_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_overrides" ADD CONSTRAINT "security_overrides_authorizing_user_id_users_id_fk" FOREIGN KEY ("authorizing_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_overrides" ADD CONSTRAINT "security_overrides_reason_code_id_reason_codes_id_fk" FOREIGN KEY ("reason_code_id") REFERENCES "public"."reason_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reason_codes_business_id_idx" ON "reason_codes" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reason_codes_class_idx" ON "reason_codes" USING btree ("business_id","usage_class","active");--> statement-breakpoint
CREATE UNIQUE INDEX "reason_codes_business_class_code_uniq" ON "reason_codes" USING btree ("business_id","usage_class","code");--> statement-breakpoint
CREATE INDEX "security_overrides_business_id_idx" ON "security_overrides" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "security_overrides_created_idx" ON "security_overrides" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "security_overrides_actor_idx" ON "security_overrides" USING btree ("business_id","actor_user_id");