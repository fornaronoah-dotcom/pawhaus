CREATE TYPE "public"."ai_proposal_status" AS ENUM('pending', 'applied', 'rejected');--> statement-breakpoint
CREATE TABLE "ai_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shopify_product_gid" text NOT NULL,
	"numeric_id" text NOT NULL,
	"status" "ai_proposal_status" DEFAULT 'pending' NOT NULL,
	"fields" jsonb NOT NULL,
	"applied_fields" text[],
	"model" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;