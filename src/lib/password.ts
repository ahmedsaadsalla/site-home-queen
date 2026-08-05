import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

const ROUNDS = env.bcryptRounds;

/** Hash oficial: bcrypt ≥ 12 rounds */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

/**
 * Verifica senha.
 * Aceita bcrypt atual e legado SHA-256 `salt:hash` (clientes/revendedores antigos).
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(password, stored);
  }
  // legado: salt:sha256hex
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || hash.length < 32) return false;
  const next = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(next));
  } catch {
    return false;
  }
}

/** true se o hash ainda é o formato legado (deve re-hash no próximo login) */
export function isLegacyPasswordHash(stored: string) {
  return Boolean(stored) && !stored.startsWith("$2");
}

/** Compat: nomes antigos usados pelos stores */
export async function createPasswordHash(password: string) {
  return hashPassword(password);
}

export function generateLegacySalt() {
  return randomBytes(8).toString("hex");
}
