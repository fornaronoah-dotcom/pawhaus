CREATE TYPE "public"."media_review_status" AS ENUM('draft', 'published_extra', 'published_main', 'discarded');--> statement-breakpoint
CREATE TABLE "flow_sent" (
	"shopify_media_id" text PRIMARY KEY NOT NULL,
	"shopify_product_gid" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shopify_product_gid" text NOT NULL,
	"numeric_id" text NOT NULL,
	"original_media_id" text,
	"original_url" text,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"data_base64" text NOT NULL,
	"status" "media_review_status" DEFAULT 'draft' NOT NULL,
	"shopify_media_id" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flow_sent" ADD CONSTRAINT "flow_sent_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_review" ADD CONSTRAINT "media_review_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;