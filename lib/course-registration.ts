import { findAcademyCourse } from "@/lib/academy";

export function validateCourseRegistration(input: unknown) {
  if (!input || typeof input !== "object") return { error: "Please complete your registration details." };
  const body = input as Record<string, unknown>;
  const field = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const courseSlug = field("courseSlug", 80);
  const name = field("name", 100);
  const phone = field("phone", 25);
  const email = field("email", 150);
  const preferredDate = field("preferredDate", 10);
  const notes = field("notes", 2000);
  if (body.website || !findAcademyCourse(courseSlug)) return { error: "Please choose a valid course." };
  if (name.length < 2 || !/^[+\d\s()-]{7,25}$/.test(phone) || phone.replace(/\D/g, "").length < 7) return { error: "Please enter your full name and a valid phone number." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (preferredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || !Number.isFinite(Date.parse(preferredDate + "T12:00:00Z")) || new Date(preferredDate + "T12:00:00Z").toISOString().slice(0,10) !== preferredDate)) return { error: "Please choose a valid preferred date." };
  return { value: { courseSlug, name, phone, email, preferredDate, notes } };
}

export const courseRegistrationTable = `CREATE TABLE IF NOT EXISTS course_registrations (
  id TEXT PRIMARY KEY, course_slug TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
  email TEXT, preferred_date TEXT, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
