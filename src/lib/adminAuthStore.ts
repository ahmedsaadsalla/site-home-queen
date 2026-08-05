import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import type { AdminRole } from "@/lib/adminSession";
import {
  LOCKOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  RESET_TOKEN_MS,
  SESSION_IDLE_MS,
} from "@/lib/adminSession";
import { appendAdminLog } from "@/lib/adminStore";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/db/mappers";

const BCRYPT_ROUNDS = Math.max(
  12,
  Number(process.env.BCRYPT_ROUNDS || 12) || 12,
);

export type SecAdminUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

export type LoginAttemptRecord = {
  key: string;
  count: number;
  lockedUntil: number | null;
};

export type ActiveSession = {
  sid: string;
  userId: string;
  username: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  lastActivityAt: string;
  ip?: string;
};

export type ResetToken = {
  tokenHash: string;
  userId: string;
  expiresAt: number;
};

export type SecurityStore = {
  users: SecAdminUser[];
  attempts: LoginAttemptRecord[];
  sessions: ActiveSession[];
  resetTokens: ResetToken[];
  lastBackupAt: string | null;
  lastResetLink?: string | null;
  updatedAt: string;
};

function userToSec(u: {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}): SecAdminUser {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    passwordHash: u.passwordHash,
    role: u.role as AdminRole,
    active: u.active,
    createdAt: iso(u.createdAt),
    updatedAt: iso(u.updatedAt),
    lastLoginAt: u.lastLoginAt ? iso(u.lastLoginAt) : null,
  };
}

async function ensureSeedAdmin() {
  const count = await prisma.adminUser.count();
  if (count > 0) return; // nunca recria se já existe administrador

  const { env } = await import("@/lib/env");
  const password = env.seedAdminPassword;
  if (!password || password.length < 8) {
    console.warn(
      "[seed] Banco sem admin. Defina SEED_ADMIN_PASSWORD (≥8) para criar o primeiro usuário.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.adminUser.create({
    data: {
      id: "adm_root",
      name: env.seedAdminName,
      username: env.seedAdminUsername.toLowerCase(),
      email: env.seedAdminEmail.toLowerCase(),
      passwordHash,
      role: "Administrador",
      active: true,
    },
  });
  await prisma.securitySettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  console.info("[seed] Administrador inicial criado:", env.seedAdminUsername);
}

export async function readSecurityStore(): Promise<SecurityStore> {
  await ensureSeedAdmin();
  const [users, attempts, sessions, tokens, settings] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.loginAttempt.findMany(),
    prisma.adminSession.findMany({ orderBy: { lastActivityAt: "desc" } }),
    prisma.passwordResetToken.findMany(),
    prisma.securitySettings.findUnique({ where: { id: 1 } }),
  ]);

  return {
    users: users.map(userToSec),
    attempts: attempts.map((a) => ({
      key: a.key,
      count: a.count,
      lockedUntil: a.lockedUntil ? a.lockedUntil.getTime() : null,
    })),
    sessions: sessions.map((s) => ({
      sid: s.id,
      userId: s.userId,
      username: s.username,
      name: s.name,
      role: s.role as AdminRole,
      createdAt: iso(s.createdAt),
      lastActivityAt: iso(s.lastActivityAt),
      ip: s.ip || undefined,
    })),
    resetTokens: tokens.map((t) => ({
      tokenHash: t.tokenHash,
      userId: t.userId,
      expiresAt: t.expiresAt.getTime(),
    })),
    lastBackupAt: settings?.lastBackupAt
      ? iso(settings.lastBackupAt)
      : null,
    lastResetLink: settings?.lastResetLink ?? null,
    updatedAt: nowIso(),
  };
}

function nowIso() {
  return new Date().toISOString();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPasswordHash(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function attemptKey(username: string, ip?: string) {
  return `${(ip || "unknown").slice(0, 64)}|${username.trim().toLowerCase()}`;
}

export async function getLockStatus(username: string, ip?: string) {
  await ensureSeedAdmin();
  const key = attemptKey(username, ip);
  const rec = await prisma.loginAttempt.findUnique({ where: { key } });
  if (!rec?.lockedUntil) return { locked: false, remainingMs: 0 };
  if (Date.now() < rec.lockedUntil.getTime()) {
    return {
      locked: true,
      remainingMs: rec.lockedUntil.getTime() - Date.now(),
    };
  }
  await prisma.loginAttempt.update({
    where: { key },
    data: { count: 0, lockedUntil: null },
  });
  return { locked: false, remainingMs: 0 };
}

export async function registerFailedLogin(username: string, ip?: string) {
  const key = attemptKey(username, ip);
  const existing = await prisma.loginAttempt.findUnique({ where: { key } });
  const count = (existing?.count || 0) + 1;
  const lockedUntil =
    count >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
  await prisma.loginAttempt.upsert({
    where: { key },
    create: { key, count, lockedUntil },
    update: { count, lockedUntil },
  });
  await appendAdminLog(
    "Login falhou",
    `Tentativa inválida para ${username.trim().toLowerCase()} (${count}/${MAX_LOGIN_ATTEMPTS})`,
    username || "desconhecido",
  );
  return {
    locked: Boolean(lockedUntil && Date.now() < lockedUntil.getTime()),
    remainingMs: lockedUntil
      ? Math.max(0, lockedUntil.getTime() - Date.now())
      : 0,
  };
}

export async function clearFailedLogins(username: string, ip?: string) {
  const key = attemptKey(username, ip);
  await prisma.loginAttempt.deleteMany({ where: { key } });
}

export async function findUserByUsername(username: string) {
  await ensureSeedAdmin();
  const u = username.trim().toLowerCase();
  const user = await prisma.adminUser.findFirst({
    where: {
      OR: [
        { username: { equals: u, mode: "insensitive" } },
        { email: { equals: u, mode: "insensitive" } },
      ],
    },
  });
  return user ? userToSec(user) : null;
}

export async function findUserById(id: string) {
  const user = await prisma.adminUser.findUnique({ where: { id } });
  return user ? userToSec(user) : null;
}

export async function authenticateUser(
  username: string,
  password: string,
  ip?: string,
): Promise<
  | { ok: true; user: SecAdminUser }
  | { ok: false; code: "invalid" | "locked" | "inactive"; remainingMs?: number }
> {
  const lock = await getLockStatus(username, ip);
  if (lock.locked) {
    return { ok: false, code: "locked", remainingMs: lock.remainingMs };
  }

  const user = await findUserByUsername(username);
  if (!user || !user.active) {
    await registerFailedLogin(username, ip);
    return { ok: false, code: "invalid" };
  }

  const match = await verifyPasswordHash(password, user.passwordHash);
  if (!match) {
    await registerFailedLogin(username, ip);
    return { ok: false, code: "invalid" };
  }

  await clearFailedLogins(username, ip);
  return { ok: true, user };
}

export async function createSession(
  user: SecAdminUser,
  ip?: string,
  userAgent?: string,
) {
  const sid = randomBytes(24).toString("hex");
  const now = new Date();
  await prisma.adminSession.deleteMany({ where: { userId: user.id } });
  await prisma.adminSession.create({
    data: {
      id: sid,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      ip,
      userAgent: userAgent?.slice(0, 500) || null,
      createdAt: now,
      lastActivityAt: now,
    },
  });
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: now },
  });
  await appendAdminLog("Login", "Acesso ao painel", user.username);
  return {
    sid,
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: iso(now),
    lastActivityAt: iso(now),
    ip,
  } satisfies ActiveSession;
}

export async function destroySession(sid: string, username?: string) {
  const existing = await prisma.adminSession.findUnique({ where: { id: sid } });
  await prisma.adminSession.deleteMany({ where: { id: sid } });
  await appendAdminLog(
    "Logout",
    "Saiu do painel",
    username || existing?.username || "Admin",
  );
}

export async function touchSession(sid: string) {
  try {
    await prisma.adminSession.update({
      where: { id: sid },
      data: { lastActivityAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

export async function listUsersPublic() {
  await ensureSeedAdmin();
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => {
    const { passwordHash: _p, ...rest } = userToSec(u);
    return rest;
  });
}

export async function upsertUser(input: {
  id?: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: AdminRole;
  active: boolean;
  actor?: string;
}) {
  await ensureSeedAdmin();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (input.id) {
    const clash = await prisma.adminUser.findFirst({
      where: {
        id: { not: input.id },
        OR: [{ username }, { email }],
      },
    });
    if (clash) throw new Error("Usuário ou e-mail já existe.");

    const data: {
      name: string;
      username: string;
      email: string;
      role: string;
      active: boolean;
      passwordHash?: string;
    } = {
      name: input.name.trim(),
      username,
      email,
      role: input.role,
      active: input.active,
    };
    if (input.password && input.password.length >= 6) {
      data.passwordHash = await hashPassword(input.password);
    }
    const u = await prisma.adminUser.update({
      where: { id: input.id },
      data,
    });
    await appendAdminLog(
      "Alteração",
      `Usuário ${u.username} atualizado`,
      input.actor || "Admin",
    );
    const { passwordHash: _p, ...pub } = userToSec(u);
    return pub;
  }

  const exists = await prisma.adminUser.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (exists) throw new Error("Usuário ou e-mail já existe.");
  if (!input.password || input.password.length < 6) {
    throw new Error("Senha deve ter no mínimo 6 caracteres.");
  }
  const u = await prisma.adminUser.create({
    data: {
      name: input.name.trim(),
      username,
      email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      active: input.active,
    },
  });
  await appendAdminLog(
    "Cadastro",
    `Usuário ${u.username} criado (${u.role})`,
    input.actor || "Admin",
  );
  const { passwordHash: _p, ...pub } = userToSec(u);
  return pub;
}

export async function deleteUser(id: string, actor?: string) {
  const u = await prisma.adminUser.findUnique({ where: { id } });
  if (!u) throw new Error("Usuário não encontrado.");
  if (u.id === "adm_root" || u.username === "admin@homequeen") {
    throw new Error("Não é possível excluir o administrador principal.");
  }
  await prisma.adminUser.delete({ where: { id } });
  await appendAdminLog(
    "Exclusão",
    `Usuário ${u.username} removido`,
    actor || "Admin",
  );
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(emailOrUser: string) {
  await ensureSeedAdmin();
  const key = emailOrUser.trim().toLowerCase();
  const user = await prisma.adminUser.findFirst({
    where: {
      active: true,
      OR: [
        { email: { equals: key, mode: "insensitive" } },
        { username: { equals: key, mode: "insensitive" } },
      ],
    },
  });
  if (!user) return { ok: true as const };

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_MS),
    },
  });

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";
  const link = `${base}/admin/login/redefinir?token=${token}`;
  await prisma.securitySettings.upsert({
    where: { id: 1 },
    create: { id: 1, lastResetLink: link },
    update: { lastResetLink: link },
  });
  await appendAdminLog(
    "Recuperação de senha",
    `Link gerado para ${user.username} (válido 1h)`,
    user.username,
  );
  if (process.env.NODE_ENV !== "production") {
    console.info("[admin reset]", link);
  }
  return {
    ok: true as const,
    link: process.env.NODE_ENV === "development" ? link : undefined,
  };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
) {
  if (!token || newPassword.length < 6) throw new Error("Dados inválidos.");
  const h = hashToken(token);
  const rec = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: h, expiresAt: { gt: new Date() } },
  });
  if (!rec) throw new Error("Link inválido ou expirado.");
  const user = await prisma.adminUser.findUnique({ where: { id: rec.userId } });
  if (!user) throw new Error("Usuário não encontrado.");
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.adminSession.deleteMany({ where: { userId: user.id } });
  await appendAdminLog(
    "Alteração",
    "Senha redefinida via link",
    user.username,
  );
  return true;
}

export async function getSecurityDashboard() {
  await ensureSeedAdmin();
  const now = Date.now();
  const cutoff = new Date(now - SESSION_IDLE_MS);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  await prisma.adminSession.deleteMany({
    where: { lastActivityAt: { lt: cutoff } },
  });

  const [users, sessions, locked, settings, loginsToday, failedToday] =
    await Promise.all([
      prisma.adminUser.findMany(),
      prisma.adminSession.findMany({ orderBy: { lastActivityAt: "desc" } }),
      prisma.loginAttempt.findMany({
        where: { lockedUntil: { gt: new Date() } },
      }),
      prisma.securitySettings.findUnique({ where: { id: 1 } }),
      prisma.adminLog.count({
        where: {
          action: "Login",
          createdAt: { gte: todayStart },
        },
      }),
      prisma.adminLog.count({
        where: {
          OR: [
            { action: { contains: "falha", mode: "insensitive" } },
            { action: { contains: "Login falhou", mode: "insensitive" } },
            { detail: { contains: "senha inválida", mode: "insensitive" } },
            { detail: { contains: "credenciais", mode: "insensitive" } },
          ],
          createdAt: { gte: todayStart },
        },
      }),
    ]);

  const usersByLast = [...users]
    .filter((u) => u.lastLoginAt)
    .sort(
      (a, b) =>
        (b.lastLoginAt?.getTime() || 0) - (a.lastLoginAt?.getTime() || 0),
    );

  const suspicious = await prisma.loginAttempt.findMany({
    where: { count: { gte: 3 } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return {
    lastLogin: usersByLast[0]
      ? {
          username: usersByLast[0].username,
          name: usersByLast[0].name,
          at: usersByLast[0].lastLoginAt
            ? iso(usersByLast[0].lastLoginAt)
            : null,
        }
      : null,
    activeSessions: sessions.map((s) => ({
      id: s.id,
      sid: s.id.slice(0, 8) + "…",
      username: s.username,
      name: s.name,
      role: s.role,
      ip: s.ip,
      userAgent: s.userAgent,
      lastActivityAt: iso(s.lastActivityAt),
      createdAt: iso(s.createdAt),
      connectedMs: Math.max(
        0,
        Date.now() - new Date(s.createdAt).getTime(),
      ),
    })),
    lockedAttempts: locked.map((a) => ({
      key: a.key,
      lockedUntil: a.lockedUntil ? a.lockedUntil.getTime() : null,
      count: a.count,
    })),
    lastBackupAt: settings?.lastBackupAt ? iso(settings.lastBackupAt) : null,
    userCount: users.length,
    stats: {
      loginsToday,
      failedLoginsToday: failedToday,
      lockedIps: locked.length,
      activeSessions: sessions.length,
      connectedAdmins: new Set(sessions.map((s) => s.userId)).size,
      suspiciousAttempts: suspicious.length,
    },
    suspicious: suspicious.map((a) => ({
      key: a.key,
      count: a.count,
      lockedUntil: a.lockedUntil ? a.lockedUntil.getTime() : null,
      updatedAt: iso(a.updatedAt),
    })),
  };
}

export async function revokeSessionById(sessionId: string, byUser: string) {
  const existing = await prisma.adminSession.findUnique({
    where: { id: sessionId },
  });
  if (!existing) throw new Error("Sessão não encontrada.");
  await prisma.adminSession.delete({ where: { id: sessionId } });
  await appendAdminLog(
    "Sessão",
    `Sessão encerrada: ${existing.username}`,
    byUser,
  );
  return true;
}

export async function unlockLoginAttempt(key: string, byUser: string) {
  await prisma.loginAttempt.deleteMany({ where: { key } });
  await appendAdminLog("Segurança", `Desbloqueio: ${key}`, byUser);
  return true;
}

export async function markBackupNow() {
  const at = new Date();
  await prisma.securitySettings.upsert({
    where: { id: 1 },
    create: { id: 1, lastBackupAt: at },
    update: { lastBackupAt: at },
  });
  return iso(at);
}
