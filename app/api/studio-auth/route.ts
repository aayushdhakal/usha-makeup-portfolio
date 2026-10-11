import { env } from "cloudflare:workers";
import {
  clearLoginAttempts, createStudioSession, deleteStudioSession, expiredSessionCookie,
  isLoginRateLimited, loginAttemptKey, recordFailedLogin, sessionCookie,
  activeLoginEmail, ensureStudioAccount, studioLoginEmail, verifyStudioPassword,
} from "@/lib/studio-auth";

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    !request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ error: "This sign-in request was blocked." }, 403);
  }
  let stage = "parse";
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "logout") {
      stage = "logout";
      await deleteStudioSession(request);
      const response = json({ ok: true });
      response.headers.append("Set-Cookie", expiredSessionCookie(request));
      return response;
    }
    if (body.action !== "login") return json({ error: "Invalid sign-in request." }, 400);
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || password.length > 200) return json({ error: "Enter your email and password." }, 400);

    stage = "rate-check";
    const key = await loginAttemptKey(request);
    if (await isLoginRateLimited(key)) return json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, 429);
    stage = "password-check";
    const valid = await verifyStudioPassword(email, password);
    if (!valid) {
      stage = "record-failure";
      await recordFailedLogin(key);
      return json({ error: "Email or password is incorrect." }, 401);
    }
    stage = "create-session";
    await ensureStudioAccount();
    const agent = request.headers.get("user-agent") || "Browser";
    const deviceLabel = /Mobile|Android|iPhone/i.test(agent) ? "Mobile browser" : "Desktop browser";
    const token = await createStudioSession(await activeLoginEmail(), deviceLabel);
    stage = "clear-attempts";
    await clearLoginAttempts(key);
    const response = json({ ok: true });
    response.headers.append("Set-Cookie", sessionCookie(token, request));
    return response;
  } catch (error) {
    if (stage === "password-check") {
      console.error("Studio password check failed", {
        emailConfigured: !!studioLoginEmail(),
        hashConfigured: !!(env as unknown as { STUDIO_PASSWORD_HASH?: string }).STUDIO_PASSWORD_HASH,
        reason: error instanceof Error ? error.message.slice(0, 120) : "Unknown",
      });
    } else {
      console.error("Studio authentication failed during " + stage);
    }
    return json({ error: "Studio sign-in is temporarily unavailable. Please try again." }, 503);
  }
}
