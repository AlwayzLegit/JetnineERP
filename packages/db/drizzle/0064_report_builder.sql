CREATE TABLE "report_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_id" text NOT NULL,
	"title" text,
	"sub_title" text,
	"footer" text,
	"run_time_information" text,
	"add_to_schedule" boolean DEFAULT false NOT NULL,
	"access" text DEFAULT 'anyone' NOT NULL,
	"system_owned" boolean DEFAULT false NOT NULL,
	"definition_json" jsonb NOT NULL,
	"owner_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_dictionaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"column_heading" text NOT NULL,
	"width" integer DEFAULT 12 NOT NULL,
	"justification" text DEFAULT 'left' NOT NULL,
	"kind" text NOT NULL,
	"formula" text,
	"join_source_id" text,
	"join_field_name" text,
	"mask_permission" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_definitions" ADD CONSTRAINT "report_definitions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_definitions" ADD CONSTRAINT "report_definitions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_dictionaries" ADD CONSTRAINT "report_dictionaries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_dictionaries" ADD CONSTRAINT "report_dictionaries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "report_definitions_business_name_uniq" ON "report_definitions" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "report_definitions_business_id_idx" ON "report_definitions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "report_definitions_source_idx" ON "report_definitions" USING btree ("business_id","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_dictionaries_source_name_uniq" ON "report_dictionaries" USING btree ("business_id","source_id","name");--> statement-breakpoint
CREATE INDEX "report_dictionaries_business_id_idx" ON "report_dictionaries" USING btree ("business_id");