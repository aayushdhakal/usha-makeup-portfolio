import { db, isStudioAdmin } from "@/lib/studio";
import { validateCourseRegistration, courseRegistrationTable } from "@/lib/course-registration";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site" || !request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "Unable to submit this registration." }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length")) > 12000) return Response.json({ error: "Registration is too large." }, { status: 413 });
    const validated = validateCourseRegistration(await request.json());
    if (!validated.value) return Response.json({ error: validated.error }, { status: 400 });
    const { courseSlug, name, phone, email, preferredDate, notes } = validated.value;
    const database = db();
    await database.prepare(courseRegistrationTable).run();
    const id = crypto.randomUUID();
    await database.prepare("INSERT INTO course_registrations(id,course_slug,name,phone,email,preferred_date,notes) VALUES(?,?,?,?,?,?,?)").bind(id, courseSlug, name, phone, email || null, preferredDate || null, notes).run();
    return Response.json({ id }, { status: 201 });
  } catch { return Response.json({ error: "Registration is temporarily unavailable. Please contact Usha at +977 9817077567." }, { status: 503 }); }
}
export async function GET() {
  if (!(await isStudioAdmin())) return Response.json({ error: "Studio access is restricted." }, { status: 403 });
  try {
    const database = db();
    await database.prepare(courseRegistrationTable).run();
    const registrations = await database.prepare("SELECT id,course_slug,name,phone,email,preferred_date,notes,datetime(created_at,'+5 hours','+45 minutes') AS created_at FROM course_registrations ORDER BY created_at DESC LIMIT 1000").all();
    return Response.json({ registrations: registrations.results }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Course registrations are temporarily unavailable." }, { status: 503 }); }
}
