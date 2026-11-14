// Staff accounts, password hashing and sessions.
// - Accounts live in the same key/value store as clinic data (Postgres when DATABASE_URL is set).
// - Passwords are hashed with scrypt and a per-user salt; plain passwords are never stored.
// - Sessions are signed, HTTP-only cookies (HMAC-SHA256 with SESSION_SECRET), valid for 12 hours.
import crypto from "crypto";
import express from "express";
import type { KeyValueStore } from "./store";

// Staff roles only. The app loads clinic-wide data, so patient self-service logins would need
// per-patient data isolation first (see README "Roadmap").
export const ROLES = ["admin", "team_lead", "ops_manager", "it_support", "facility_database_administrator"] as const;
export type Role = (typeof ROLES)[number];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string; // "salt:hash" (hex)
  createdAt: string;
  lastLoginAt?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

const USERS_KEY = "auth_users";
const COOKIE = "cpm_session";
const SESSION_HOURS = 12;
const MIN_PASSWORD = 10;

const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set - using a temporary secret, so everyone is signed out when the server restarts.");
}

const toPublic = ({ passwordHash, ...user }: StoredUser): PublicUser => user;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token: string): { uid: string; exp: number } | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof data.exp === "number" && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function readCookie(req: express.Request, name: string): string | undefined {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

function setSessionCookie(req: express.Request, res: express.Response, uid: string) {
  const token = sign({ uid, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}${secure ? "; Secure" : ""}`
  );
}

function clearSessionCookie(res: express.Response) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// Simple brute-force protection: 8 failed sign-ins per IP per 15 minutes
const failures = new Map<string, { count: number; until: number }>();
function tooManyFailures(ip: string): boolean {
  const f = failures.get(ip);
  return !!f && f.count >= 8 && f.until > Date.now();
}
function recordFailure(ip: string) {
  const f = failures.get(ip);
  if (!f || f.until < Date.now()) failures.set(ip, { count: 1, until: Date.now() + 15 * 60 * 1000 });
  else f.count++;
}

const isEmail = (s: unknown): s is string => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isRole = (s: unknown): s is Role => typeof s === "string" && (ROLES as readonly string[]).includes(s);
const asyncRoute =
  (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response) => {
    fn(req, res).catch(err => {
      console.error(`Auth error in ${req.method} ${req.path}:`, err);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    });
  };

export function createAuth(store: KeyValueStore) {
  const getUsers = async (): Promise<StoredUser[]> => {
    const value = await store.get(USERS_KEY);
    return Array.isArray(value) ? (value as StoredUser[]) : [];
  };
  const saveUsers = (users: StoredUser[]) => store.set(USERS_KEY, users);

  /** Attaches req.user when a valid session cookie is present. */
  const loadSession: express.RequestHandler = (req, _res, next) => {
    const token = readCookie(req, COOKIE);
    const session = token ? verify(token) : null;
    if (!session) return next();
    getUsers()
      .then(users => {
        const user = users.find(u => u.id === session.uid);
        if (user) req.user = toPublic(user);
        next();
      })
      .catch(next);
  };

  const requireUser: express.RequestHandler = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Please sign in." });
    next();
  };

  const requireRole =
    (...roles: Role[]): express.RequestHandler =>
    (req, res, next) => {
      if (!req.user) return res.status(401).json({ error: "Please sign in." });
      if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Your role doesn't have access to this." });
      next();
    };

  const router = express.Router();

  // Is this a new install, and who is signed in?
  router.get("/api/auth/status", asyncRoute(async (req, res) => {
    const users = await getUsers();
    res.json({ setupRequired: users.length === 0, user: req.user ?? null });
  }));

  // First run only: create the owner (clinic administrator) account
  router.post("/api/auth/setup", asyncRoute(async (req, res) => {
    const users = await getUsers();
    if (users.length > 0) return res.status(409).json({ error: "This clinic is already set up. Please sign in." });
    const { name, email, password } = req.body ?? {};
    if (!name || typeof name !== "string") return res.status(400).json({ error: "Enter your name." });
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Use a password with at least ${MIN_PASSWORD} characters.` });
    }
    const owner: StoredUser = {
      id: `usr_${crypto.randomUUID()}`, name: name.trim(), email: email.trim().toLowerCase(), role: "admin",
      passwordHash: hashPassword(password), createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    };
    await saveUsers([owner]);
    setSessionCookie(req, res, owner.id);
    res.status(201).json({ user: toPublic(owner) });
  }));

  router.post("/api/auth/login", asyncRoute(async (req, res) => {
    const ip = req.ip || "unknown";
    if (tooManyFailures(ip)) return res.status(429).json({ error: "Too many failed sign-ins. Try again in 15 minutes." });
    const { email, password } = req.body ?? {};
    const users = await getUsers();
    const user = users.find(u => u.email === String(email ?? "").trim().toLowerCase());
    if (!user || typeof password !== "string" || !verifyPassword(password, user.passwordHash)) {
      recordFailure(ip);
      return res.status(401).json({ error: "That email and password don't match." });
    }
    failures.delete(ip);
    user.lastLoginAt = new Date().toISOString();
    await saveUsers(users);
    setSessionCookie(req, res, user.id);
    res.json({ user: toPublic(user) });
  }));

  router.post("/api/auth/logout", (_req, res) => {
    clearSessionCookie(res);
    res.json({ success: true });
  });

  router.post("/api/auth/password", requireUser, asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    const users = await getUsers();
    const user = users.find(u => u.id === req.user!.id);
    if (!user || typeof currentPassword !== "string" || !verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }
    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Use a new password with at least ${MIN_PASSWORD} characters.` });
    }
    user.passwordHash = hashPassword(newPassword);
    await saveUsers(users);
    res.json({ success: true });
  }));

  // Staff management (administrators only)
  router.get("/api/auth/users", requireRole("admin"), asyncRoute(async (_req, res) => {
    res.json((await getUsers()).map(toPublic));
  }));

  router.post("/api/auth/users", requireRole("admin"), asyncRoute(async (req, res) => {
    const { name, email, role, password } = req.body ?? {};
    if (!name || typeof name !== "string") return res.status(400).json({ error: "Enter the person's name." });
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!isRole(role)) return res.status(400).json({ error: "Choose a role." });
    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Use a temporary password with at least ${MIN_PASSWORD} characters.` });
    }
    const users = await getUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some(u => u.email === normalized)) return res.status(409).json({ error: "Someone already uses that email." });
    const user: StoredUser = {
      id: `usr_${crypto.randomUUID()}`, name: name.trim(), email: normalized, role,
      passwordHash: hashPassword(password), createdAt: new Date().toISOString(),
    };
    await saveUsers([...users, user]);
    res.status(201).json({ user: toPublic(user) });
  }));

  router.patch("/api/auth/users/:id", requireRole("admin"), asyncRoute(async (req, res) => {
    const users = await getUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "That account no longer exists." });
    const { role, password } = req.body ?? {};
    if (role !== undefined) {
      if (!isRole(role)) return res.status(400).json({ error: "Choose a role." });
      if (user.role === "admin" && role !== "admin" && users.filter(u => u.role === "admin").length === 1) {
        return res.status(400).json({ error: "The clinic needs at least one administrator." });
      }
      user.role = role;
    }
    if (password !== undefined) {
      // Administrator password reset (e.g. a staff member forgot theirs)
      if (typeof password !== "string" || password.length < MIN_PASSWORD) {
        return res.status(400).json({ error: `Use a temporary password with at least ${MIN_PASSWORD} characters.` });
      }
      user.passwordHash = hashPassword(password);
    }
    await saveUsers(users);
    res.json({ user: toPublic(user) });
  }));

  router.delete("/api/auth/users/:id", requireRole("admin"), asyncRoute(async (req, res) => {
    const users = await getUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "That account no longer exists." });
    if (user.id === req.user!.id) return res.status(400).json({ error: "You can't remove your own account." });
    if (user.role === "admin" && users.filter(u => u.role === "admin").length === 1) {
      return res.status(400).json({ error: "The clinic needs at least one administrator." });
    }
    await saveUsers(users.filter(u => u.id !== user.id));
    res.json({ success: true });
  }));

  return { router, loadSession, requireUser, requireRole };
}
