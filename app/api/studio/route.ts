import { createBooking, db, isStudioAdmin, todayNepal, validDate, type BookingInput } from "@/lib/studio";

const fail = (message: string, status = 400) => Response.json({ error: message }, { status });
const str = (value: unknown, max = 150) => String(value ?? "").trim().slice(0, max);
const num = (value: unknown) => Number(value);
const appointmentColumns = "a.id,a.date,a.start_min,a.end_min,a.status,a.source,a.notes,a.price_rupees,datetime(a.created_at,'+5 hours','+45 minutes') AS created_at,datetime(a.completed_at,'+5 hours','+45 minutes') AS completed_at,a.staff_id,a.service_id,a.client_id,c.name AS client_name,c.phone AS client_phone,s.name AS service_name,m.name AS staff_name,b.id AS bill_id,b.subtotal_rupees,b.discount_rupees,b.total_rupees,b.due_on,COALESCE((SELECT SUM(p.amount_rupees) FROM payments p WHERE p.bill_id=b.id),0) AS paid_rupees";
const appointmentFrom = " FROM appointments a JOIN clients c ON c.id=a.client_id JOIN services s ON s.id=a.service_id JOIN staff m ON m.id=a.staff_id LEFT JOIN bills b ON b.appointment_id=a.id ";

export async function GET(request: Request) {
  if (!(await isStudioAdmin())) return fail("Studio access is restricted.", 403);
  try {
    const database = db();
    const url = new URL(request.url);
    const clientId = num(url.searchParams.get("clientId"));
    if (url.searchParams.get("mode") === "client" && Number.isInteger(clientId) && clientId > 0) {
      const history = await database.prepare(
        "SELECT a.id,a.date,a.start_min,a.end_min,a.status,a.source,a.notes,a.price_rupees,datetime(a.created_at,'+5 hours','+45 minutes') AS created_at,datetime(a.completed_at,'+5 hours','+45 minutes') AS completed_at,s.name AS service_name,m.name AS staff_name,b.id AS bill_id,b.total_rupees,b.due_on,COALESCE((SELECT SUM(p.amount_rupees) FROM payments p WHERE p.bill_id=b.id),0) AS paid_rupees " +
        "FROM appointments a JOIN services s ON s.id=a.service_id JOIN staff m ON m.id=a.staff_id LEFT JOIN bills b ON b.appointment_id=a.id WHERE a.client_id=? ORDER BY a.date DESC,a.start_min DESC LIMIT 100"
      ).bind(clientId).all();
      const payments = await database.prepare(
        "SELECT p.id,p.bill_id,p.amount_rupees,p.method,p.kind,p.reference,p.paid_on,p.recorded_at FROM payments p JOIN bills b ON b.id=p.bill_id JOIN appointments a ON a.id=b.appointment_id WHERE a.client_id=? ORDER BY p.paid_on DESC,p.id DESC LIMIT 100"
      ).bind(clientId).all();
      return Response.json({ history: history.results, payments: payments.results });
    }
    if (url.searchParams.get("mode") === "records") {
      const [records, payments, metrics] = await database.batch([
        database.prepare("SELECT " + appointmentColumns + appointmentFrom + "ORDER BY a.date DESC,a.start_min DESC LIMIT 3000"),
        database.prepare("SELECT p.id,p.bill_id,p.amount_rupees,p.method,p.kind,p.paid_on,a.id AS appointment_id,c.id AS client_id,c.name AS client_name FROM payments p JOIN bills b ON b.id=p.bill_id JOIN appointments a ON a.id=b.appointment_id JOIN clients c ON c.id=a.client_id ORDER BY p.paid_on DESC,p.id DESC LIMIT 3000"),
        database.prepare("SELECT (SELECT COUNT(*) FROM appointments WHERE status NOT IN ('cancelled','no-show')) AS bookings,(SELECT COALESCE(SUM(b.total_rupees),0) FROM bills b JOIN appointments a ON a.id=b.appointment_id WHERE a.status='completed') AS work_value,(SELECT COALESCE(SUM(amount_rupees),0) FROM payments) AS received,(SELECT COALESCE(SUM(amount_rupees),0) FROM payments WHERE kind='advance') AS advances,(SELECT COALESCE(SUM(MAX(0,b.total_rupees-COALESCE((SELECT SUM(p.amount_rupees) FROM payments p WHERE p.bill_id=b.id),0))),0) FROM bills b JOIN appointments a ON a.id=b.appointment_id WHERE a.status NOT IN ('cancelled','no-show')) AS due"),
      ]);
      return Response.json({ records: records.results, payments: payments.results, metrics: metrics.results[0], limited: records.results.length === 3000 });
    }
    const date = url.searchParams.get("date") || "";
    if (!validDate(date)) return fail("Choose a valid calendar date.");
    const [staff, services, resources, clients, appointments] = await database.batch([
      database.prepare("SELECT id,name,email,role,categories,start_min,end_min,weekdays,active FROM staff ORDER BY active DESC,name"),
      database.prepare("SELECT id,name,category,duration_min,price_rupees,resource_id,active FROM services ORDER BY active DESC,category,name"),
      database.prepare("SELECT id,name,active FROM resources ORDER BY active DESC,name"),
      database.prepare("SELECT c.id,c.name,c.phone,c.email,c.notes,COUNT(a.id) AS visits,MAX(CASE WHEN a.status='completed' THEN a.date END) AS last_visit,MAX(date(a.created_at,'+5 hours','+45 minutes')) AS last_booked FROM clients c LEFT JOIN appointments a ON a.client_id=c.id GROUP BY c.id ORDER BY c.name LIMIT 1000"),
      database.prepare(
        "SELECT " + appointmentColumns + appointmentFrom + "WHERE a.date=? ORDER BY a.start_min,m.name"
      ).bind(date),
    ]);
    return Response.json({ staff: staff.results, services: services.results, resources: resources.results, clients: clients.results, appointments: appointments.results });
  } catch {
    return fail("Studio records are temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  if (!(await isStudioAdmin())) return fail("Studio access is restricted.", 403);
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site" || !request.headers.get("content-type")?.startsWith("application/json")) return fail("This studio request was blocked.", 403);
  try {
    const body = await request.json() as Record<string, unknown>;
    const database = db();
    const action = str(body.action, 40);
    if (action === "addStaff" || action === "updateStaff") {
      const name = str(body.name, 100), role = str(body.role, 80), email = str(body.email, 254).toLowerCase();
      const categories = Array.isArray(body.categories) ? body.categories.filter((x) => x === "Makeup" || x === "Nails").join(",") : "";
      const startMin = num(body.startMin), endMin = num(body.endMin);
      const weekdays = Array.isArray(body.weekdays) ? body.weekdays.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6).join(",") : "";
      if (!name || !role || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !categories || !weekdays || !Number.isInteger(startMin) || !Number.isInteger(endMin) || startMin < 0 || endMin > 1440 || endMin <= startMin) return fail("Check the staff name, email, designation, and schedule.");
      if (action === "addStaff") await database.prepare("INSERT INTO staff(name,email,role,categories,start_min,end_min,weekdays) VALUES(?,?,?,?,?,?,?)").bind(name, email, role, categories, startMin, endMin, weekdays).run();
      else {
        const id = num(body.id);
        if (!Number.isInteger(id) || id < 1) return fail("Invalid staff member.");
        await database.prepare("UPDATE staff SET name=?,email=?,role=?,categories=?,start_min=?,end_min=?,weekdays=?,active=? WHERE id=?").bind(name, email, role, categories, startMin, endMin, weekdays, body.active === false ? 0 : 1, id).run();
      }
      return Response.json({ ok: true });
    }
    if (action === "addResource") {
      const name = str(body.name, 100);
      if (!name) return fail("Enter a station or room name.");
      await database.prepare("INSERT INTO resources(name) VALUES(?)").bind(name).run();
      return Response.json({ ok: true });
    }
    if (action === "addService" || action === "updateService") {
      const name = str(body.name, 100), category = str(body.category, 20);
      const duration = num(body.durationMin), price = num(body.priceRupees);
      const resourceId = body.resourceId ? num(body.resourceId) : null;
      if (!name || !["Makeup", "Nails"].includes(category) || !Number.isInteger(duration) || duration < 15 || duration > 480 || duration % 15 !== 0 || !Number.isInteger(price) || price < 0 || price > 10000000 || (resourceId !== null && (!Number.isInteger(resourceId) || resourceId < 1))) return fail("Check the service name, duration, and price.");
      if (action === "addService") await database.prepare("INSERT INTO services(name,category,duration_min,price_rupees,resource_id) VALUES(?,?,?,?,?)").bind(name, category, duration, price, resourceId).run();
      else {
        const id = num(body.id);
        if (!Number.isInteger(id) || id < 1) return fail("Invalid service.");
        await database.prepare("UPDATE services SET name=?,category=?,duration_min=?,price_rupees=?,resource_id=?,active=? WHERE id=?").bind(name, category, duration, price, resourceId, body.active === false ? 0 : 1, id).run();
      }
      return Response.json({ ok: true });
    }
    if (action === "addBooking") {
      const result = await createBooking(body as unknown as BookingInput, true);
      if ("error" in result) return fail(result.error || "Booking could not be placed.", result.status);
      return Response.json({ id: result.id }, { status: 201 });
    }
    if (action === "appointmentStatus") {
      const id = str(body.id, 40), status = str(body.status, 20);
      if (!id || !["confirmed", "completed", "cancelled", "no-show"].includes(status)) return fail("Invalid appointment status.");
      await database.prepare("UPDATE appointments SET status=?,completed_at=CASE WHEN ?='completed' THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE NULL END WHERE id=?").bind(status, status, id).run();
      return Response.json({ ok: true });
    }
    if (action === "updateClient") {
      const id = num(body.id), notes = str(body.notes, 2000), email = str(body.email, 150);
      if (!Number.isInteger(id) || id < 1) return fail("Invalid client.");
      await database.prepare("UPDATE clients SET notes=?,email=? WHERE id=?").bind(notes, email || null, id).run();
      return Response.json({ ok: true });
    }
    if (action === "updateBill") {
      const appointmentId = str(body.appointmentId, 40);
      const discount = num(body.discountRupees);
      const dueOn = str(body.dueOn, 10) || null;
      if (!Number.isInteger(discount) || discount < 0 || (dueOn !== null && !validDate(dueOn))) return fail("Check the discount and due date.");
      const bill = await database.prepare("SELECT id,subtotal_rupees FROM bills WHERE appointment_id=?").bind(appointmentId).first<{ id: number; subtotal_rupees: number }>();
      if (!bill || discount > bill.subtotal_rupees) return fail("Discount exceeds the service price.");
      const total = bill.subtotal_rupees - discount;
      const result = await database.prepare("UPDATE bills SET discount_rupees=?,total_rupees=?,due_on=? WHERE id=? AND ? >= COALESCE((SELECT SUM(amount_rupees) FROM payments WHERE bill_id=?),0)").bind(discount, total, dueOn, bill.id, total, bill.id).run();
      if (!result.meta.changes) return fail("The new total is below payments already recorded.");
      return Response.json({ ok: true });
    }
    if (action === "addPayment") {
      const billId = num(body.billId), amount = num(body.amountRupees);
      const method = str(body.method, 30), reference = str(body.reference, 100), paidOn = str(body.paidOn, 10), kind = str(body.kind, 20) || "payment";
      if (!Number.isInteger(billId) || billId < 1 || !Number.isInteger(amount) || amount <= 0 || !["cash", "QR", "bank", "card", "other"].includes(method) || !["advance", "payment", "final"].includes(kind) || !validDate(paidOn) || paidOn > todayNepal()) return fail("Check the payment amount, method, and date.");
      const result = await database.prepare(
        "INSERT INTO payments(bill_id,amount_rupees,method,kind,reference,paid_on) SELECT id,?,?,?,?,? FROM bills WHERE id=? AND total_rupees - COALESCE((SELECT SUM(amount_rupees) FROM payments WHERE bill_id=?),0) >= ? RETURNING id"
      ).bind(amount, method, kind, reference, paidOn, billId, billId, amount).all();
      if (!result.results.length) return fail("Payment exceeds the balance due.");
      return Response.json({ ok: true });
    }
    if (action === "updatePaymentKind") {
      const id = num(body.id), billId = num(body.billId), kind = str(body.kind, 20);
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(billId) || billId < 1 || !["advance", "payment", "final"].includes(kind)) return fail("Choose a valid payment type.");
      const result = await database.prepare("UPDATE payments SET kind=? WHERE id=? AND bill_id=?").bind(kind, id, billId).run();
      if (!result.meta.changes) return fail("Payment was not found.", 404);
      return Response.json({ ok: true });
    }
    if (action === "completeAndSettle") {
      const id = str(body.id, 40), method = str(body.method, 30), receiveFull = body.receiveFull === true;
      if (!id || !["cash", "QR", "bank", "card", "other"].includes(method)) return fail("Check the booking and payment method.");
      const row = await database.prepare("SELECT a.date,a.status,b.id AS bill_id,b.total_rupees,COALESCE((SELECT SUM(amount_rupees) FROM payments WHERE bill_id=b.id),0) AS paid_rupees FROM appointments a JOIN bills b ON b.appointment_id=a.id WHERE a.id=?").bind(id).first<{date:string;status:string;bill_id:number;total_rupees:number;paid_rupees:number}>();
      if (!row || ["cancelled", "no-show"].includes(row.status) || row.date > todayNepal()) return fail("Only a current or past active booking can be completed.");
      const balance = Math.max(0, row.total_rupees - row.paid_rupees);
      if (receiveFull && balance > 0) {
        const payment = await database.prepare("INSERT INTO payments(bill_id,amount_rupees,method,kind,reference,paid_on) SELECT id,?,?,'final','Final balance',? FROM bills WHERE id=? AND total_rupees-COALESCE((SELECT SUM(amount_rupees) FROM payments WHERE bill_id=?),0)=? RETURNING id").bind(balance, method, todayNepal(), row.bill_id, row.bill_id, balance).all();
        if (!payment.results.length) return fail("The balance changed. Refresh and try again.");
      }
      await database.prepare("UPDATE appointments SET status='completed',completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP) WHERE id=?").bind(id).run();
      return Response.json({ ok: true });
    }
    return fail("Unknown studio action.");
  } catch {
    return fail("The change could not be saved. Please try again.", 503);
  }
}
