"use client";
import { useEffect, useState } from "react";
import { findAcademyCourse } from "@/lib/academy";
type Registration = { id: string; course_slug: string; name: string; phone: string; email: string | null; preferred_date: string | null; notes: string; created_at: string };
export default function CourseRegistrationRecords() {
  const [records, setRecords] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/course-registrations", { signal: controller.signal }).then(async response => {
      const data = await response.json() as { registrations: Registration[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load registrations.");
      setRecords(data.registrations);
    }).catch(cause => { if (cause.name !== "AbortError") setError(cause.message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return <div className="studio-panel"><div className="section-header"><div><h2>Academy registrations</h2><p>Contact students to confirm the class schedule and final fee.</p></div></div>
    {loading ? <p>Loading registrations…</p> : error ? <p role="alert">{error}</p> : !records.length ? <div className="empty-panel"><h3>No course registrations yet</h3><p>Requests submitted through the Academy pages will appear here.</p></div> : <div className="academy-registration-records">{records.map(record => <article key={record.id}><h3>{record.name}</h3><p><strong>{findAcademyCourse(record.course_slug)?.title || record.course_slug}</strong></p><p><a href={`tel:${record.phone}`}>{record.phone}</a>{record.email && <> · <a href={`mailto:${record.email}`}>{record.email}</a></>}</p><p>Preferred start: {record.preferred_date || "To be discussed"}</p>{record.notes && <p>{record.notes}</p>}<small>Received: {record.created_at} · Reference: {record.id.slice(0,8).toUpperCase()}</small></article>)}</div>}
  </div>;
}
