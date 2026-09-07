CREATE TABLE "member_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"recipient_membership_id" uuid NOT NULL,
	"actor_membership_id" uuid,
	"order_id" uuid NOT NULL,
	"task_id" uuid,
	"note_id" uuid,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"event_key" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"assignee_membership_id" uuid,
	"created_by_membership_id" uuid,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_tasks_status_check" CHECK ("order_tasks"."status" in ('open', 'in_progress', 'blocked', 'done')),
	CONSTRAINT "order_tasks_priority_check" CHECK ("order_tasks"."priority" in ('normal', 'high'))
);
--> statement-breakpoint
ALTER TABLE "order_notes" ADD COLUMN "mentioned_membership_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_recipient_membership_id_memberships_id_fk" FOREIGN KEY ("recipient_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_actor_membership_id_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_task_id_order_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."order_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_note_id_order_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."order_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tasks" ADD CONSTRAINT "order_tasks_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tasks" ADD CONSTRAINT "order_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tasks" ADD CONSTRAINT "order_tasks_assignee_membership_id_memberships_id_fk" FOREIGN KEY ("assignee_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tasks" ADD CONSTRAINT "order_tasks_created_by_membership_id_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_notifications_business_idx" ON "member_notifications" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "member_notifications_inbox_idx" ON "member_notifications" USING btree ("business_id","recipient_membership_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "member_notifications_event_uniq" ON "member_notifications" USING btree ("business_id","recipient_membership_id","event_key");--> statement-breakpoint
CREATE INDEX "order_tasks_business_idx" ON "order_tasks" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "order_tasks_order_idx" ON "order_tasks" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_tasks_queue_idx" ON "order_tasks" USING btree ("business_id","assignee_membership_id","status","due_at");