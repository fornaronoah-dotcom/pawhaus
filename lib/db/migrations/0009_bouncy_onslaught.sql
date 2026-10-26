CREATE TABLE "customer_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text NOT NULL,
	"product_handle" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_favorites_unique" ON "customer_favorites" USING btree ("customer_id","product_handle");--> statement-breakpoint
CREATE INDEX "customer_favorites_customer_idx" ON "customer_favorites" USING btree ("customer_id");