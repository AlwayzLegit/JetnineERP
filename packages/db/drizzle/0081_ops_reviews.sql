CREATE TABLE "ops_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "ops_reviews" ADD CONSTRAINT "ops_reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_reviews" ADD CONSTRAINT "ops_reviews_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ops_reviews_business_id_idx" ON "ops_reviews" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "ops_reviews_reviewed_idx" ON "ops_reviews" USING btree ("business_id","reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_reviews_subject_uniq" ON "ops_reviews" USING btree ("business_id","subject_type","subject_id");