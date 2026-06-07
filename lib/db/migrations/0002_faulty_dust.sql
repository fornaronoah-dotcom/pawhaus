CREATE TYPE "public"."opt_status" AS ENUM('niet_gecontroleerd', 'klaar_voor_ai', 'ai_voorstel_gemaakt', 'goedgekeurd', 'gepubliceerd');--> statement-breakpoint
CREATE TABLE "product_status" (
	"shopify_product_gid" text PRIMARY KEY NOT NULL,
	"status" "opt_status" DEFAULT 'niet_gecontroleerd' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_status" ADD CONSTRAINT "product_status_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;