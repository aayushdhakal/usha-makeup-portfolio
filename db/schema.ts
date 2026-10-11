import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull().default("Artist"),
  email: text("email").notNull().default(""),
  categories: text("categories").notNull().default("Makeup,Nails"),
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
  weekdays: text("weekdays").notNull().default("1,2,3,4,5,6"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceRupees: integer("price_rupees").notNull(),
  resourceId: integer("resource_id").references(() => resources.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_clients_phone_name").on(table.phone, table.name)]);

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  resourceId: integer("resource_id").references(() => resources.id),
  date: text("date").notNull(),
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
  priceRupees: integer("price_rupees").notNull(),
  status: text("status").notNull().default("confirmed"),
  source: text("source").notNull().default("online"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [
  index("idx_appointments_date_staff").on(table.date, table.staffId),
  index("idx_appointments_client").on(table.clientId),
]);

export const bills = sqliteTable("bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: text("appointment_id").notNull().references(() => appointments.id),
  subtotalRupees: integer("subtotal_rupees").notNull(),
  discountRupees: integer("discount_rupees").notNull().default(0),
  totalRupees: integer("total_rupees").notNull(),
  dueOn: text("due_on"),
  issuedAt: text("issued_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_bills_appointment").on(table.appointmentId)]);

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  billId: integer("bill_id").notNull().references(() => bills.id),
  amountRupees: integer("amount_rupees").notNull(),
  method: text("method").notNull(),
  kind: text("kind").notNull().default("payment"),
  reference: text("reference").notNull().default(""),
  paidOn: text("paid_on").notNull().default(""),
  recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_payments_bill").on(table.billId)]);

export const studioSessions = sqliteTable("studio_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  deviceLabel: text("device_label").notNull().default("Unknown device"),
  lastSeenAt: integer("last_seen_at").notNull().default(0),
}, (table) => [index("idx_studio_sessions_expires").on(table.expiresAt)]);

export const studioAccounts = sqliteTable("studio_accounts", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default("Studio owner"),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("Admin"),
  avatarData: text("avatar_data").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studioLoginAttempts = sqliteTable("studio_login_attempts", {
  clientKey: text("client_key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  failures: integer("failures").notNull(),
});

export const courseRegistrations = sqliteTable("course_registrations", {
  id: text("id").primaryKey(),
  courseSlug: text("course_slug").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  preferredDate: text("preferred_date"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
