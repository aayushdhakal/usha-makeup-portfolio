"use client";

import { useState } from "react";

type Props = { mode: "login" | "reset"; currentSignInPath?: string };

export default function StudioAuthCard({ mode, currentSignInPath }: Props) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isReset = mode === "reset";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReset) {
      setMessage("Reset emails are not available yet. Please contact the studio owner for access.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/studio-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: data.get("email"), password: data.get("password") }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setMessage(result.error || "Sign-in failed. Please try again.");
      } else {
        window.location.assign("/studio");
      }
    } catch {
      setMessage("Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="studio-auth-page">
      <div className="studio-auth-wrap">
        <a className="studio-auth-logo" href="/" aria-label="Usha Makeup and Nails home"><img src="/usha-logo-white.png" alt="Usha Makeup and Nails" /></a>
        <p className="studio-auth-intro">{isReset ? "Reset your password" : "Sign in to your studio account"}</p>
        <section className="studio-auth-card" aria-labelledby="studio-auth-title">
          <h1 id="studio-auth-title" className="sr-only">{isReset ? "Reset your password" : "Studio sign in"}</h1>
          {isReset && <p className="studio-reset-description">We'll <strong>email a reset link</strong> to the address on your account.</p>}
          <form onSubmit={submit}>
            <label htmlFor="studio-email">Email</label>
            <input id="studio-email" name="email" type="email" autoComplete="email" required />
            {!isReset && <>
              <label htmlFor="studio-password">Password</label>
              <input id="studio-password" name="password" type="password" autoComplete="current-password" required />
              <a className="studio-forgot-link" href="/studio/forgot-password">Forgot password?</a>
            </>}
            <button type="submit" disabled={submitting}>{isReset ? "Email reset link" : submitting ? "Signing in..." : "Sign in"}</button>
          </form>
          {message && <p className="studio-auth-message" role="status">{message}</p>}
        </section>
        {isReset ? <a className="studio-auth-secondary" href="/studio/login">Back to sign in</a> : currentSignInPath ? <a className="studio-auth-secondary" href={currentSignInPath} target="_top">Current staff sign-in</a> : null}
      </div>
    </main>
  );
}
