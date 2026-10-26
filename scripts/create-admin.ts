import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminUsers } from "../lib/db/schema";
import { ADMIN_ROLES, type AdminRole } from "../lib/admin/roles";

/**
 * Maakt (of werkt bij) een admin-gebruiker. NIET als publieke signup — enkel
 * handmatig draaien:
 *
 *   corepack pnpm create-admin
 *
 * Waarden komen uit CLI-args, anders env, anders interactieve prompt:
 *   --email / ADMIN_EMAIL
 *   --password / ADMIN_PASSWORD
 *   --name / ADMIN_NAME
 *   --role / ADMIN_ROLE   (owner | editor, default owner)
 */

function argOf(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function ask(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  if (hidden) {
    // Eenvoudige maskering: onderdruk de echo tijdens het typen.
    const asMutable = stdout as unknown as { write: (s: string) => boolean };
    const orig = asMutable.write.bind(stdout);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
      () => orig("*");
  }
  const answer = await rl.question(question);
  rl.close();
  if (hidden) stdout.write("\n");
  return answer;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL ontbreekt (zie .env.example).");
  }

  const email = (
    argOf("--email") ??
    process.env.ADMIN_EMAIL ??
    (await ask("E-mail: "))
  )
    .trim()
    .toLowerCase();

  const name =
    argOf("--name") ?? process.env.ADMIN_NAME ?? (await ask("Naam: ")).trim();

  const password =
    argOf("--password") ??
    process.env.ADMIN_PASSWORD ??
    (await ask("Wachtwoord: ", true));

  const role = (
    argOf("--role") ??
    process.env.ADMIN_ROLE ??
    "owner"
  ).trim() as AdminRole;

  if (!email || !name || !password) {
    throw new Error("E-mail, naam én wachtwoord zijn verplicht.");
  }
  if (!(ADMIN_ROLES as readonly string[]).includes(role)) {
    throw new Error(`Rol moet één van zijn: ${ADMIN_ROLES.join(", ")}.`);
  }
  if (password.length < 10) {
    throw new Error("Kies een wachtwoord van minstens 10 tekens.");
  }

  const passwordHash = await hash(password);

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  await db
    .insert(adminUsers)
    .values({ email, name, passwordHash, role, isActive: true })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: { name, passwordHash, role, isActive: true },
    });

  await sql.end();
  console.log(`✓ Admin-gebruiker klaar: ${email} (${role})`);
}

main().catch((err) => {
  console.error("✕ Kon admin niet aanmaken:", err.message ?? err);
  process.exit(1);
});
