import { createBooking, type BookingInput } from "@/lib/studio";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site" || !request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Unable to place this booking." }, { status: 403 });
  }
  try {
    const body = await request.json() as BookingInput & { website?: string };
    if (body.website) return Response.json({ error: "Unable to place this booking." }, { status: 400 });
    const result = await createBooking(body, false);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ id: result.id }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to place this booking. Please try again." }, { status: 503 });
  }
}
