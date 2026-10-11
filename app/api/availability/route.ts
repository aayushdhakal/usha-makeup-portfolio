import { getSlots } from "@/lib/studio";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = Number(url.searchParams.get("serviceId"));
  const staffId = Number(url.searchParams.get("staffId"));
  const date = url.searchParams.get("date") || "";
  try {
    const slots = await getSlots(serviceId, staffId, date);
    return Response.json({ slots });
  } catch {
    return Response.json({ error: "Availability could not be loaded." }, { status: 503 });
  }
}
