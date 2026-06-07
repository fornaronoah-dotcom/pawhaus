import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

/**
 * Postgres-connectie (postgres.js) + Drizzle.
 * Singleton via globalThis zodat Next.js HMR in dev niet telkens nieuwe
 * connecties opent.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL ontbreekt. Stel die in (zie .env.example) — Postgres is " +
      "vereist voor het admin-paneel.",
  );
}

const globalForDb = globalThis as unknown as {
  __pawhausSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__pawhausSql ??
  postgres(connectionString, { max: 10, prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pawhausSql = sql;
}

export const db = drizzle(sql, { schema });
export { sql };
