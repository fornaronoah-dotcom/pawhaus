import "server-only";

import { hash, verify } from "@node-rs/argon2";

/**
 * Wachtwoord-hashing met argon2id (de aanbevolen variant). @node-rs/argon2
 * gebruikt standaard Argon2id en levert prebuilt binaries (ook musl/Alpine).
 */

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  return verify(storedHash, password);
}
