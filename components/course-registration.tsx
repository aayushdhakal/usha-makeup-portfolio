"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Course = { slug: string; title: string; days: number; price: number };
const WHATSAPP = "https://wa.me/9779817077567";

export default function CourseRegistration({ course }: { course: Course }) {
  const [busy, setBusy] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    const message = [
      `Hi Usha, I would like to register for ${course.title}.`,
      `Name: ${String(fields.get("name") || "").trim()}`,
      `Phone: ${String(fields.get("phone") || "").trim()}`,
      fields.get("email") ? `Email: ${String(fields.get("email")).trim()}` : null,
      fields.get("preferredDate") ? `Preferred start: ${String(fields.get("preferredDate"))}` : null,
      fields.get("notes") ? `Notes: ${String(fields.get("notes")).trim()}` : null,
    ].filter(Boolean).join("\n");
    window.open(`${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setBusy(false);
  }

  return (
    <section className="academy-registration booking-detail-page" id="registration" aria-labelledby="registration-title">
      <form onSubmit={submit}>
        <h2 id="registration-title">Register for this course</h2>
        <p className="intro">Share your details and continue on WhatsApp. Your class schedule and final fee will be confirmed with the academy.</p>
        <div className="step-heading"><h3>Your details</h3></div>
        <div className="client-fields">
          <label>Full name<Input name="name" autoComplete="name" maxLength={100} required /></label>
          <label>Phone number<Input name="phone" type="tel" autoComplete="tel" maxLength={25} required /></label>
          <label>Email (optional)<Input name="email" type="email" autoComplete="email" maxLength={150} /></label>
        </div>
        <div className="step-heading second"><h3>Your course</h3></div>
        <div className="academy-registration-fields">
          <label>Course<Input value={course.title} readOnly /></label>
          <label>Preferred start date (optional)<Input name="preferredDate" type="date" /></label>
        </div>
        <label className="academy-registration-notes">Anything you would like us to know? (optional)<Textarea name="notes" maxLength={2000} rows={3} /></label>
        <Button type="submit" disabled={busy}>{busy ? "Opening WhatsApp…" : "Continue on WhatsApp"}</Button>
      </form>
    </section>
  );
}
