import { db } from "@/lib/studio";

export async function GET() {
  try {
    const database = db();
    const [services, staff] = await database.batch([
      database.prepare("SELECT id,name,category,duration_min,price_rupees,resource_id FROM services WHERE active=1 ORDER BY category,name"),
      database.prepare("SELECT id,name,role,categories,start_min,end_min,weekdays FROM staff WHERE active=1 ORDER BY name"),
    ]);
    return Response.json({ services: services.results, staff: staff.results });
  } catch {
    return Response.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }
}
