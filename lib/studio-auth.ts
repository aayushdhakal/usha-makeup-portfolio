import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export type StudioAuthMethod = "password" | "chatgpt";

export const COOKIE_NAME = "usha_studio_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 8;
const encoder = new TextEncoder();

type StudioEnv = { STUDIO_ADMIN_EMAILS?: string; STUDIO_LOGIN_EMAIL?: string; STUDIO_PASSWORD_HASH?: string };
const config = () => env as unknown as StudioEnv;
const database = () => {
  if (!env.DB) throw new Error("Studio database is unavailable");
  return env.DB;
};
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const fromHex = (value: string) => new Uint8Array(value.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || []);
const sha256 = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
const nowSeconds = () => Math.floor(Date.now() / 1000);

export function studioLoginEmail() {
  return config().STUDIO_LOGIN_EMAIL?.trim().toLowerCase() || "";
}

export type StudioAccount = { name: string; email: string; phone: string; role: string; avatar_data: string; password_hash: string };
export async function getStudioAccount() {
  return database().prepare("SELECT name,email,phone,role,avatar_data,password_hash FROM studio_accounts WHERE id=1").first<StudioAccount>();
}
export async function activeLoginEmail() {
  return (await getStudioAccount())?.email || studioLoginEmail();
}
export async function ensureStudioAccount() {
  if (!studioLoginEmail() || !config().STUDIO_PASSWORD_HASH) throw new Error("Studio password sign-in is not configured");
  await database().prepare("INSERT OR IGNORE INTO studio_accounts(id,name,email,phone,role,password_hash) VALUES(1,'Studio owner',?,'','Admin',?)")
    .bind(studioLoginEmail(), config().STUDIO_PASSWORD_HASH).run();
  return getStudioAccount();
}
export async function sessionHash() {
  const token = (await cookies()).get(COOKIE_NAME)?.value || "";
  return /^[a-f0-9]{64}$/.test(token) ? sha256(token) : "";
}

export async function getStudioAuthMethod(): Promise<StudioAuthMethod | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value || "";
  if (/^[a-f0-9]{64}$/.test(token)) {
    try {
      const row = await database().prepare("SELECT email FROM studio_sessions WHERE token_hash=? AND expires_at>?")
        .bind(await sha256(token), nowSeconds()).first<{ email: string }>();
      if (row?.email === await activeLoginEmail()) return "password";
    } catch { /* ChatGPT access is checked below. */ }
  }
  const user = await getChatGPTUser();
  const allowedEmails = (config().STUDIO_ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase());
  return user && allowedEmails.includes(user.email.toLowerCase()) ? "chatgpt" : null;
}

export async function requireStudioAdmin(): Promise<StudioAuthMethod> {
  const method = await getStudioAuthMethod();
  if (method) return method;
  redirect("/studio/login");
}

export async function verifyPasswordHash(password: string, encoded: string) {
  const match = /^pbkdf2\$(\d+)\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(encoded);
  if (!match) throw new Error("Studio password sign-in is not configured");
  const iterations = Number(match[1]);
  // The production Workers runtime caps one PBKDF2 operation at 100,000 rounds.
  if (iterations !== 100000) throw new Error("Invalid password configuration");
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({
    name: "PBKDF2", hash: "SHA-256", salt: fromHex(match[2]), iterations,
  }, key, 256));
  const expected = fromHex(match[3]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

export async function hashStudioPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const value = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256));
  return `pbkdf2$100000$${hex(salt)}$${hex(value)}`;
}

export async function verifyStudioPassword(email: string, password: string) {
  const account = await getStudioAccount();
  const loginEmail = account?.email || studioLoginEmail();
  const encoded = account?.password_hash || config().STUDIO_PASSWORD_HASH || "";
  const valid = await verifyPasswordHash(password, encoded);
  return valid && email.trim().toLowerCase() === loginEmail;
}

export async function loginAttemptKey(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  return sha256(ip.slice(0, 100));
}

export async function isLoginRateLimited(key: string) {
  const row = await database().prepare("SELECT window_start,failures FROM studio_login_attempts WHERE client_key=?")
    .bind(key).first<{ window_start: number; failures: number }>();
  return !!row && row.window_start > nowSeconds() - ATTEMPT_WINDOW_SECONDS && row.failures >= MAX_FAILURES;
}

export async function recordFailedLogin(key: string) {
  const now = nowSeconds();
  const cutoff = now - ATTEMPT_WINDOW_SECONDS;
  await database().prepare(
    "INSERT INTO studio_login_attempts(client_key,window_start,failures) VALUES(?,?,1) " +
    "ON CONFLICT(client_key) DO UPDATE SET " +
    "failures=CASE WHEN studio_login_attempts.window_start<? THEN 1 ELSE studio_login_attempts.failures+1 END, " +
    "window_start=CASE WHEN studio_login_attempts.window_start<? THEN excluded.window_start ELSE studio_login_attempts.window_start END"
  ).bind(key, now, cutoff, cutoff).run();
}

export async function createStudioSession(email: string, deviceLabel = "Browser") {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const now = nowSeconds();
  await database().batch([
    database().prepare("DELETE FROM studio_sessions WHERE expires_at<=?").bind(now),
    database().prepare("INSERT INTO studio_sessions(token_hash,email,created_at,expires_at,device_label,last_seen_at) VALUES(?,?,?,?,?,?)")
      .bind(await sha256(token), email, now, now + SESSION_SECONDS, deviceLabel.slice(0, 120), now),
  ]);
  return token;
}

export async function clearLoginAttempts(key: string) {
  await database().prepare("DELETE FROM studio_login_attempts WHERE client_key=?").bind(key).run();
}

export async function deleteStudioSession(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1) || "";
  if (/^[a-f0-9]{64}$/.test(token)) {
    await database().prepare("DELETE FROM studio_sessions WHERE token_hash=?").bind(await sha256(token)).run();
  }
}

export function sessionCookie(token: string, request: Request) {
  const host = new URL(request.url).hostname;
  const secure = host === "localhost" || host === "127.0.0.1" ? "" : "; Secure";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function expiredSessionCookie(request: Request) {
  const host = new URL(request.url).hostname;
  const secure = host === "localhost" || host === "127.0.0.1" ? "" : "; Secure";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
