import { defineConfig } from "drizzle-kit";

/**
 * Drizzle-kit config. Migraties worden gegenereerd in ./lib/db/migrations.
 * Genereren:  corepack pnpm db:generate
 * Toepassen:  corepack pnpm db:migrate
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
