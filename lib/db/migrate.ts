import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Past openstaande migraties toe. Wordt zowel lokaal (corepack pnpm db:migrate)
 * als bij container-boot uitgevoerd. Gebruikt een eigen kortlevende connectie
 * (max: 1) die daarna sluit.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL ontbreekt — kan migraties niet uitvoeren.");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("[db] migraties toepassen…");
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  console.log("[db] migraties klaar.");

  await sql.end();
}

main().catch((err) => {
  console.error("[db] migratie mislukt:", err);
  process.exit(1);
});
