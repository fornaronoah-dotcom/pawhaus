import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

/**
 * Postgres-connectie (postgres.js) + Drizzle.
 * Singleton via globalThis zodat Next.js HMR in dev niet telkens nieuwe
 * connecties opent.
 *
 * Lazy: de connectie (en de DATABASE_URL-check) gebeurt pas bij het eerste
 * gebruik van `db`, niet bij het importeren. Zo faalt `next build` niet
 * ("Collecting page data") als DATABASE_URL op build-tijd ontbreekt.
 */

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __pawhausSql?: ReturnType<typeof postgres>;
  __pawhausDb?: Db;
};

function getDb(): Db {
  if (globalForDb.__pawhausDb) return globalForDb.__pawhausDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL ontbreekt. Stel die in (zie .env.example) — Postgres is " +
        "vereist voor het admin-paneel.",
    );
  }

  const sql =
    globalForDb.__pawhausSql ??
    postgres(connectionString, { max: 10, prepare: false });
  globalForDb.__pawhausSql = sql;
  globalForDb.__pawhausDb = drizzle(sql, { schema });
  return globalForDb.__pawhausDb;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
