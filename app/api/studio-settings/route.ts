import { ensureStudioAccount, getStudioAuthMethod, getStudioAccount, hashStudioPassword, sessionHash, verifyPasswordHash } from "@/lib/studio-auth";
import { db } from "@/lib/studio";

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET() {
  const method = await getStudioAuthMethod();
  if (!method) return reply({ error: "Studio access is restricted." }, 403);
  try {
    const account = await getStudioAccount() || await ensureStudioAccount();
    const currentHash = method === "password" ? await sessionHash() : "";
    const sessions = method === "password" ? (await db().prepare("SELECT token_hash,device_label,created_at,expires_at FROM studio_sessions WHERE expires_at>? ORDER BY created_at DESC").bind(Math.floor(Date.now() / 1000)).all()).results.map((s) => ({ id: s.token_hash, label: s.device_label, createdAt: s.created_at, expiresAt: s.expires_at, current: s.token_hash === currentHash })) : [];
    return reply({ profile: account ? { name: account.name, email: account.email, phone: account.phone, role: account.role, avatar: account.avatar_data } : null, method, sessions });
  } catch { return reply({ error: "Settings could not be loaded." }, 503); }
}

export async function POST(request: Request) {
  const method = await getStudioAuthMethod();
  if (!method) return reply({ error: "Studio access is restricted." }, 403);
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site" || !request.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "This request was blocked." }, 403);
  try {
    const body = await request.json() as Record<string, unknown>;
    const account = await getStudioAccount() || await ensureStudioAccount();
    if (!account) return reply({ error: "Sign in with the studio account to set up the profile." }, 400);
    if (body.action === "profile") {
      const name = clean(body.name, 100), email = clean(body.email, 254).toLowerCase(), phone = clean(body.phone, 30), role = clean(body.role, 60);
      const avatar = typeof body.avatar === "string" ? body.avatar : "";
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !role || (phone && !/^\+?[0-9\s()-]{7,30}$/.test(phone)) || (avatar && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar) || avatar.length > 280000))) return reply({ error: "Check the profile details and photo." }, 400);
      await db().batch([
        db().prepare("UPDATE studio_accounts SET name=?,email=?,phone=?,role=?,avatar_data=?,updated_at=CURRENT_TIMESTAMP WHERE id=1").bind(name, email, phone, role, avatar),
        db().prepare("UPDATE studio_sessions SET email=? WHERE email=?").bind(email, account.email),
      ]);
      return reply({ ok: true });
    }
    if (method !== "password") return reply({ error: "Sign in with the studio email and password to change security settings." }, 403);
    if (body.action === "password") {
      const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const next = typeof body.newPassword === "string" ? body.newPassword : "";
      if (next.length < 12 || next.length > 200 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return reply({ error: "Use at least 12 characters with letters and a number." }, 400);
      if (!await verifyPasswordHash(current, account.password_hash)) return reply({ error: "Current password is incorrect." }, 401);
      const hash = await hashStudioPassword(next), currentHash = await sessionHash();
      await db().batch([
        db().prepare("UPDATE studio_accounts SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=1").bind(hash),
        db().prepare("DELETE FROM studio_sessions WHERE token_hash<>?").bind(currentHash),
      ]);
      return reply({ ok: true });
    }
    if (body.action === "revokeSession") {
      const id = clean(body.id, 64), currentHash = await sessionHash();
      if (!/^[a-f0-9]{64}$/.test(id) || id === currentHash) return reply({ error: "Choose another device to sign out." }, 400);
      await db().prepare("DELETE FROM studio_sessions WHERE token_hash=? AND email=?").bind(id, account.email).run();
      return reply({ ok: true });
    }
    if (body.action === "revokeOthers") {
      await db().prepare("DELETE FROM studio_sessions WHERE token_hash<>? AND email=?").bind(await sessionHash(), account.email).run();
      return reply({ ok: true });
    }
    return reply({ error: "Unknown settings action." }, 400);
  } catch { return reply({ error: "Settings could not be saved." }, 503); }
}
