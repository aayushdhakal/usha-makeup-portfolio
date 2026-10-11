import { env } from "cloudflare:workers";
import { getStudioAuthMethod } from "@/lib/studio-auth";
import { findPortfolioCategory } from "@/lib/portfolio";

export type Service = { id: number; name: string; category: string; duration_min: number; price_rupees: number; resource_id: number | null };
export type StaffMember = { id: number; name: string; role: string; categories: string; start_min: number; end_min: number; weekdays: string };
export type Busy = { staff_id: number; resource_id: number | null; start_min: number; end_min: number };

export function db() {
  if (!env.DB) throw new Error("Studio database is unavailable");
  return env.DB;
}

export async function isStudioAdmin() {
  return (await getStudioAuthMethod()) !== null;
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function weekday(date: string) {
  return new Date(date + "T12:00:00Z").getUTCDay();
}

export function todayNepal() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const find = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return find("year") + "-" + find("month") + "-" + find("day");
}

export function nowMinNepal() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  return Number(parts.find((part) => part.type === "hour")?.value) * 60 + Number(parts.find((part) => part.type === "minute")?.value);
}

export function formatMin(value: number) {
  return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
}

export function canWork(staff: StaffMember, service: Service, date: string, startMin: number, allowPast = false) {
  if (!staff.weekdays.split(",").includes(String(weekday(date)))) return false;
  if (!staff.categories.split(",").includes(service.category)) return false;
  if (startMin < staff.start_min || startMin + service.duration_min > staff.end_min) return false;
  if (!allowPast && date < todayNepal()) return false;
  if (!allowPast && date === todayNepal() && startMin <= nowMinNepal()) return false;
  return true;
}

export async function getSlots(serviceId: number, staffId: number, date: string) {
  if (!validDate(date)) return [];
  const database = db();
  const service = await database.prepare("SELECT id,name,category,duration_min,price_rupees,resource_id FROM services WHERE id=? AND active=1").bind(serviceId).first<Service>();
  const member = await database.prepare("SELECT id,name,role,categories,start_min,end_min,weekdays FROM staff WHERE id=? AND active=1").bind(staffId).first<StaffMember>();
  if (!service || !member) return [];
  const busy = (await database.prepare("SELECT staff_id,resource_id,start_min,end_min FROM appointments WHERE date=? AND status IN ('confirmed','completed') AND (staff_id=? OR (resource_id IS NOT NULL AND resource_id=?))").bind(date, staffId, service.resource_id ?? -1).all<Busy>()).results;
  const slots: string[] = [];
  for (let minute = member.start_min; minute + service.duration_min <= member.end_min; minute += 15) {
    if (!canWork(member, service, date, minute)) continue;
    if (busy.some((b) => b.start_min < minute + service.duration_min && b.end_min > minute && (b.staff_id === staffId || (service.resource_id !== null && b.resource_id === service.resource_id)))) continue;
    slots.push(formatMin(minute));
  }
  return slots;
}

export type BookingInput = {
  serviceId: number; staffId: number; date: string; time: string;
  name: string; phone: string; email?: string; notes?: string; source?: string; makeoverType?: string;
};

export async function createBooking(input: BookingInput, isAdmin: boolean) {
  const database = db();
  const name = input.name?.trim().slice(0, 100) || "";
  const phone = input.phone?.trim().replace(/[\s()-]/g, "").slice(0, 25) || "";
  const email = input.email?.trim().slice(0, 150) || null;
  const makeover = typeof input.makeoverType === "string" ? findPortfolioCategory(input.makeoverType) : undefined;
  const notes = isAdmin ? (input.notes?.trim().slice(0, 2000) || "") : (makeover ? `Makeover: ${makeover.title}` : "");
  const serviceId = Number(input.serviceId), staffId = Number(input.staffId);
  const date = String(input.date || "");
  const time = String(input.time || "");
  if (!name || !/^\+?\d{7,15}$/.test(phone) || !validDate(date) || !/^\d{2}:\d{2}$/.test(time) || !Number.isInteger(serviceId) || !Number.isInteger(staffId)) return { error: "Please check the booking details.", status: 400 };
  const startMin = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  if (startMin % 15 !== 0 || startMin < 0 || startMin >= 1440) return { error: "Please choose a valid time.", status: 400 };
  const service = await database.prepare("SELECT id,name,category,duration_min,price_rupees,resource_id FROM services WHERE id=? AND active=1").bind(serviceId).first<Service>();
  const member = await database.prepare("SELECT id,name,role,categories,start_min,end_min,weekdays FROM staff WHERE id=? AND active=1").bind(staffId).first<StaffMember>();
  if (!service || !member || !canWork(member, service, date, startMin, isAdmin)) return { error: "That service or time is unavailable.", status: 409 };
  const id = crypto.randomUUID();
  const source = isAdmin && ["walk-in", "phone", "instagram", "online"].includes(input.source || "") ? input.source : "online";
  const result = await database.batch([
    database.prepare("INSERT INTO clients(name,phone,email) VALUES(?,?,?) ON CONFLICT(phone,name) DO NOTHING").bind(name, phone, email),
    database.prepare(
      "INSERT INTO appointments(id,client_id,service_id,staff_id,resource_id,date,start_min,end_min,price_rupees,source,notes) " +
      "SELECT ?,c.id,s.id,m.id,s.resource_id,?,?,?,?,?,? FROM clients c JOIN services s ON s.id=? JOIN staff m ON m.id=? WHERE c.phone=? AND c.name=? " +
      "AND s.active=1 AND m.active=1 AND NOT EXISTS (" +
      "SELECT 1 FROM appointments a WHERE a.date=? AND a.status IN ('confirmed','completed') " +
      "AND a.start_min<? AND a.end_min>? AND (a.staff_id=m.id OR (s.resource_id IS NOT NULL AND a.resource_id=s.resource_id))) " +
      "RETURNING id"
    ).bind(id, date, startMin, startMin + service.duration_min, service.price_rupees, source, notes, serviceId, staffId, phone, name, date, startMin + service.duration_min, startMin),
    database.prepare("INSERT INTO bills(appointment_id,subtotal_rupees,total_rupees) SELECT id,price_rupees,price_rupees FROM appointments WHERE id=?").bind(id),
  ]);
  if (!result[1]?.results?.length) return { error: "That time was just booked. Please choose another.", status: 409 };
  return { id, status: 201 };
}
