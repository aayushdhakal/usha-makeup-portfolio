"use client";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CircleCheck } from "lucide-react";

type Course = { slug: string; title: string; days: number; price: number };
export default function CourseRegistration({ course }: { course: Course }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/course-registrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseSlug: course.slug, name: fields.get("name"), phone: fields.get("phone"), email: fields.get("email"), preferredDate: fields.get("preferredDate"), notes: fields.get("notes"), website: fields.get("website") }) });
      const result = await response.json() as { id: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to register. Please try again.");
      setReference(result.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to register. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="academy-registration booking-detail-page" id="registration" aria-labelledby="registration-title">
    {reference ? <div className="academy-registration-success" role="status"><CircleCheck size={48} aria-hidden="true" /><h2 id="registration-title">Registration request received!</h2><p>Your request for {course.title} has been saved. Please contact Usha to confirm the class schedule and final fee.</p><p>Reference: {reference.slice(0, 8).toUpperCase()}</p><a href="tel:+9779817077567">Call Usha</a></div> : <form onSubmit={submit}>
      <h2 id="registration-title">Register for this course</h2>
      <p className="intro">Share your details and preferred start date. Your class schedule and final fee will be confirmed with the academy.</p>
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
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p className="academy-registration-error" role="alert">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit registration"}</Button>
    </form>}
  </section>;
}
