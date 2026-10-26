-- Rol van enum (admin_role) naar text + CHECK. Veilige volgorde: eerst default
-- droppen, dan type casten met USING, dan nieuwe default + check, dan enum drop.
ALTER TABLE "admin_users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "role" SET DEFAULT 'editor';--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_check" CHECK ("admin_users"."role" in ('owner','admin','marketing','content','editor'));--> statement-breakpoint
DROP TYPE "public"."admin_role";
