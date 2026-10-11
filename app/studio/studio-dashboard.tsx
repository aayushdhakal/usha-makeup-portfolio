"use client";

import CourseRegistrationRecords from "@/components/course-registration-records";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { CalendarDays, Users, Settings2, Plus, ReceiptText, ChevronLeft, ChevronRight, LayoutDashboard, ListChecks, Wallet, UserRound, ShieldCheck, Palette, LogOut, Search } from "lucide-react";
import { toBik, toGreg_text, daysInMonth } from "bikram-sambat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Staff = { id: number; name: string; email: string; role: string; categories: string; start_min: number; end_min: number; weekdays: string; active: number };
type Service = { id: number; name: string; category: string; duration_min: number; price_rupees: number; resource_id: number | null; active: number };
type Resource = { id: number; name: string; active: number };
type Client = { id: number; name: string; phone: string; email: string | null; notes: string; visits: number; last_visit: string | null; last_booked: string | null };
type Appointment = { id: string; date: string; start_min: number; end_min: number; status: string; source: string; notes: string; price_rupees: number; created_at: string; completed_at: string | null; staff_id: number; service_id: number; client_id: number; client_name: string; client_phone: string; service_name: string; staff_name: string; bill_id: number; subtotal_rupees: number; discount_rupees: number; total_rupees: number; due_on: string | null; paid_rupees: number };
type Payment = { id: number; bill_id: number; amount_rupees: number; method: string; kind: string; reference: string; paid_on: string; client_name?: string };
type History = { history: Appointment[]; payments: Payment[] };
type Data = { staff: Staff[]; services: Service[]; resources: Resource[]; clients: Client[]; appointments: Appointment[] };
type Records = { records: Appointment[]; payments: Payment[]; metrics: { bookings: number; work_value: number; received: number; advances: number; due: number }; limited: boolean };
type Profile = { name: string; email: string; phone: string; role: string; avatar: string };
type Device = { id: string; label: string; createdAt: number; expiresAt: number; current: boolean };
type View = "academy" | "overview" | "bookings" | "calendar" | "clients" | "staff" | "finance" | "profile" | "security" | "appearance";
const empty: Data = { staff: [], services: [], resources: [], clients: [], appointments: [] };
const money = (n: number) => "Rs " + Number(n || 0).toLocaleString("en-NP");
const time = (n: number) => String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
const minute = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
const today = () => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => p.find((part) => part.type === type)?.value || "";
  return value("year") + "-" + value("month") + "-" + value("day");
};
const shiftDate = (value: string, days: number) => {
  const d = new Date(value + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
};
const niceDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
const bsMonths = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
const initialBs = () => toBik(today());
const emptyRecords: Records = { records: [], payments: [], metrics: { bookings: 0, work_value: 0, received: 0, advances: 0, due: 0 }, limited: false };

export default function StudioDashboard({ authMethod }: { authMethod: "password" | "chatgpt" }) {
  const [date, setDate] = useState(today);
  const [view, setView] = useState<View>("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [records, setRecords] = useState<Records>(emptyRecords);
  const [profile, setProfile] = useState<Profile>({ name: "Studio owner", email: "", phone: "", role: "Admin", avatar: "" });
  const [devices, setDevices] = useState<Device[]>([]);
  const [bsMonth, setBsMonth] = useState(initialBs);
  const [clientFilter, setClientFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [paymentKind, setPaymentKind] = useState("advance");
  const [receiveFull, setReceiveFull] = useState(false);
  const [compactText, setCompactText] = useState(true);
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<History>({ history: [], payments: [] });
  const [search, setSearch] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [bookingDate, setBookingDate] = useState(today);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookingTime, setBookingTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentReference, setPaymentReference] = useState("");
  const [discount, setDiscount] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [newResource, setNewResource] = useState("");
  const [staffForm, setStaffForm] = useState({ id: 0, name: "", email: "", role: "", categories: ["Makeup", "Nails"], start: "10:00", end: "18:00", weekdays: [1, 2, 3, 4, 5, 6], active: true });
  const [serviceForm, setServiceForm] = useState({ id: 0, name: "", category: "Makeup", durationMin: "60", priceRupees: "", resourceId: "", active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/studio?date=" + date);
      const result = await response.json() as Data & { error?: string };
      if (!response.ok) throw new Error(result.error || "Studio records could not be loaded.");
      setData(result);
      setSelected((current) => current ? result.appointments.find((item) => item.id === current.id) || current : null);
      setClient((current) => current ? result.clients.find((item) => item.id === current.id) || null : null);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Studio records could not be loaded."); }
    finally { setLoading(false); }
  }, [date]);
  useEffect(() => { void load(); }, [load]);
  const loadRecords = useCallback(async () => {
    try {
      const response = await fetch("/api/studio?mode=records");
      const result = await response.json() as Records & { error?: string };
      if (!response.ok) throw new Error(result.error || "Booking records could not be loaded.");
      setRecords(result);
      setSelected((current) => current ? result.records.find((item) => item.id === current.id) || current : null);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Booking records could not be loaded."); }
  }, []);
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/studio-settings");
      if (!response.ok) return;
      const result = await response.json() as { profile: Profile | null; sessions: Device[] };
      if (result.profile) setProfile(result.profile);
      setDevices(result.sessions || []);
    } catch { /* Dashboard remains available if settings are temporarily unavailable. */ }
  }, []);
  useEffect(() => { void loadRecords(); void loadSettings(); }, [loadRecords, loadSettings]);
  useEffect(() => { setCompactText(window.localStorage.getItem("usha-studio-compact-text") !== "false"); }, []);
  useEffect(() => {
    if (!serviceId || !staffId || !bookingDate) { setSlots([]); setBookingTime(""); return; }
    const controller = new AbortController();
    fetch("/api/availability?" + new URLSearchParams({ serviceId, staffId, date: bookingDate }), { signal: controller.signal })
      .then((r) => r.json() as Promise<{ slots: string[] }>).then((r) => setSlots(r.slots || []))
      .catch(() => {});
    setBookingTime("");
    return () => controller.abort();
  }, [serviceId, staffId, bookingDate]);
  useEffect(() => {
    if (!selected && !client) { setHistory({ history: [], payments: [] }); return; }
    const id = selected?.client_id || client?.id;
    if (!id) return;
    fetch("/api/studio?mode=client&clientId=" + id).then((r) => r.json() as Promise<History>).then(setHistory).catch(() => {});
  }, [selected?.id, client?.id]);
  useEffect(() => { if (selected) { setDiscount(String(selected.discount_rupees || 0)); setDueOn(selected.due_on || ""); } }, [selected?.id]);
  useEffect(() => { if (client) setClientNotes(client.notes || ""); }, [client?.id]);

  async function post(body: Record<string, unknown>) {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string; id?: string };
      if (!response.ok) throw new Error(result.error || "The change could not be saved.");
      await load();
      await loadRecords();
      return result;
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "The change could not be saved."); return null; }
    finally { setSaving(false); }
  }

  async function saveSettings(body: Record<string, unknown>) {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/studio-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Settings could not be saved.");
      await loadSettings();
      setMessage("Changes saved.");
      return true;
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Settings could not be saved."); return false; }
    finally { setSaving(false); }
  }

  const activeStaff = data.staff.filter((member) => member.active);
  const activeServices = data.services.filter((service) => service.active);
  const chosenService = activeServices.find((service) => String(service.id) === serviceId);
  const eligibleStaff = activeStaff.filter((member) => member.categories.split(",").includes(chosenService?.category || ""));
  const booked = data.appointments.filter((a) => a.status !== "cancelled" && a.status !== "no-show");
  const due = booked.reduce((sum, a) => sum + Math.max(0, a.total_rupees - a.paid_rupees), 0);
  const filterStart = clientFilter === "7" ? shiftDate(today(), -6) : clientFilter === "30" ? shiftDate(today(), -29) : clientFilter === "custom" ? fromDate : "";
  const filterEnd = clientFilter === "custom" ? toDate : today();
  const filteredClients = data.clients.filter((person) => {
    if (!(person.name + " " + person.phone + " " + (person.email || "")).toLowerCase().includes(search.toLowerCase())) return false;
    if (clientFilter === "all") return true;
    return records.records.some((a) => a.client_id === person.id && ((a.created_at?.slice(0, 10) >= filterStart && a.created_at?.slice(0, 10) <= filterEnd) || (a.status === "completed" && a.date >= filterStart && a.date <= filterEnd)));
  });
  const listedBookings = records.records.filter((a) => (a.client_name + " " + a.client_phone + " " + a.service_name).toLowerCase().includes(bookingSearch.toLowerCase()));
  const selectedMonthStart = toGreg_text(bsMonth.year, bsMonth.month, 1);
  const selectedMonthDays = daysInMonth(bsMonth.year, bsMonth.month);
  const monthStartOffset = new Date(selectedMonthStart + "T12:00:00Z").getUTCDay();
  const monthCells = Array.from({ length: selectedMonthDays }, (_, index) => ({ day: index + 1, ad: toGreg_text(bsMonth.year, bsMonth.month, index + 1) }));
  const monthCounts = useMemo(() => records.records.reduce<Record<string, number>>((counts, a) => {
    if (a.status !== "cancelled" && a.status !== "no-show") counts[a.date] = (counts[a.date] || 0) + 1;
    return counts;
  }, {}), [records.records]);
  const dayStart = Math.min(540, ...activeStaff.map((member) => member.start_min));
  const dayEnd = Math.max(1080, ...activeStaff.map((member) => member.end_min));
  const dayHeight = (dayEnd - dayStart) / 30 * 58;
  const markers = useMemo(() => Array.from({ length: (dayEnd - dayStart) / 30 + 1 }, (_, i) => dayStart + i * 30), [dayStart, dayEnd]);
  const billPayments = history.payments.filter((payment) => payment.bill_id === selected?.bill_id);
  const openBooking = () => { setBookingDate(date); setBookingOpen(true); };
  const shiftBsMonth = (delta: number) => setBsMonth((current) => {
    const total = current.year * 12 + current.month - 1 + delta;
    return { year: Math.floor(total / 12), month: total % 12 + 1, day: 1 };
  });
  const signOut = async () => {
    if (authMethod === "chatgpt") { window.location.assign("/signout-with-chatgpt?return_to=/studio/login"); return; }
    try {
      const response = await fetch("/api/studio-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      if (!response.ok) throw new Error("Sign-out failed");
      window.location.assign("/studio/login");
    } catch { setMessage("Could not sign out. Please try again."); }
  };
  const navItems: { id: View; label: string; icon: typeof CalendarDays }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "bookings", label: "Bookings", icon: ListChecks },
    { id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "clients", label: "Clients", icon: Users },
    { id: "academy", label: "Academy", icon: ListChecks },
    { id: "staff", label: "Staff & services", icon: UserRound }, { id: "finance", label: "Finance", icon: Wallet },
  ];
  const pageTitles: Record<View, string> = { academy: "Academy", overview: "Overview", bookings: "Bookings", calendar: "Calendar", clients: "Clients", staff: "Staff & services", finance: "Finance", profile: "Profile", security: "Security", appearance: "Appearance" };
  const onAvatarFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Choose an image file."); return; }
    const url = URL.createObjectURL(file);
    try {
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      const canvas = document.createElement("canvas"); canvas.width = 280; canvas.height = 280;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo could not be processed.");
      const side = Math.min(picture.width, picture.height);
      context.drawImage(picture, (picture.width - side) / 2, (picture.height - side) / 2, side, side, 0, 0, 280, 280);
      setProfile((current) => ({ ...current, avatar: canvas.toDataURL("image/jpeg", 0.72) }));
    } catch { setMessage("That photo could not be opened. Try a JPG or PNG."); }
    finally { URL.revokeObjectURL(url); }
  };
  const bookingRows = (items: Appointment[]) => items.length ? <div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Client</th><th>Appointment</th><th>Service / artist</th><th>Status</th><th>Paid</th><th>Due</th></tr></thead><tbody>{items.map((a) => <tr key={a.id} onClick={() => setSelected(a)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelected(a); }}><td><strong>{a.client_name}</strong><small>{a.client_phone}</small></td><td>{a.date}<small>{time(a.start_min)}</small></td><td>{a.service_name}<small>{a.staff_name}</small></td><td><span className={"record-status status-" + a.status}>{a.status}</span></td><td>{money(a.paid_rupees)}</td><td>{money(Math.max(0, a.total_rupees - a.paid_rupees))}</td></tr>)}</tbody></table></div> : <div className="empty-panel"><h3>No bookings found</h3><p>New bookings will appear here as soon as they are saved.</p></div>;

  return (
    <main className={compactText ? "studio-shell compact-text" : "studio-shell"}>
      <aside className="studio-sidebar">
        <a className="studio-brand" href="/" aria-label="Usha Makeup and Nails home"><img src="/usha-logo-white.png" alt="Usha Makeup and Nails" /></a>
        <div className="sidebar-caption">STUDIO MANAGEMENT</div>
        <nav className="studio-side-nav" aria-label="Dashboard sections">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={18} /> {label}</button>)}
          <button type="button" className={settingsOpen || ["profile", "security", "appearance"].includes(view) ? "active" : ""} onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}><Settings2 size={18} /> Settings <ChevronRight className={settingsOpen ? "settings-chevron open" : "settings-chevron"} size={15} /></button>
          {settingsOpen && <div className="studio-sub-nav">
            {([{ id: "profile", label: "Profile", icon: UserRound }, { id: "security", label: "Security", icon: ShieldCheck }, { id: "appearance", label: "Appearance", icon: Palette }] as const).map(({ id, label, icon: Icon }) => <button key={id} type="button" className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={16} /> {label}</button>)}
          </div>}
        </nav>
        <a className="sidebar-booking" href="/">Open booking page ↗</a>
        <button className="sidebar-signout" type="button" onClick={signOut}><LogOut size={16} /> Sign out</button>
      </aside>
      <section className="studio-main">
        <div className="studio-top"><div><span className="eyebrow">STUDIO WORKSPACE</span><h1>{pageTitles[view]}</h1></div><div className="studio-top-actions"><Button onClick={openBooking}><Plus size={16} /> Add booking or walk-in</Button><button type="button" className="studio-account" onClick={() => { setSettingsOpen(true); setView("profile"); }} aria-label="View logged in account">{profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{profile.name.charAt(0)}</span>}<span><strong>{profile.name}</strong><small>{profile.email || (authMethod === "chatgpt" ? "ChatGPT access" : "Studio account")}</small></span></button><button className="studio-top-signout" type="button" onClick={signOut}>Sign out</button></div></div>
        {message && <div className="studio-alert" role="alert">{message}<button onClick={() => setMessage("")}>Dismiss</button></div>}
        {view === "academy" && <CourseRegistrationRecords />}
        {view === "overview" && <div className="studio-panel">
          <div className="studio-welcome"><div><span className="eyebrow">GOOD TO SEE YOU</span><h2>Studio at a glance</h2><p>Bookings, clients, and money in one place.</p></div><button type="button" onClick={() => setView("calendar")}>Open calendar <ChevronRight size={17} /></button></div>
          <div className="studio-stats four"><div><span>Bookings</span><strong>{records.metrics.bookings}</strong></div><div><span>Upcoming</span><strong>{records.records.filter((a) => a.date >= today() && a.status === "confirmed").length}</strong></div><div><span>Money received</span><strong>{money(records.metrics.received)}</strong></div><div><span>Balance due</span><strong>{money(records.metrics.due)}</strong></div></div>
          <div className="section-header"><div><h2>Today&apos;s appointments</h2><p>{niceDate(today())} · {records.records.filter((a) => a.date === today() && a.status !== "cancelled").length} bookings</p></div><Button variant="outline" onClick={() => setView("bookings")}>View all bookings</Button></div>
          {bookingRows(records.records.filter((a) => a.date === today() && a.status !== "cancelled"))}
          <div className="section-header"><div><h2>Recently booked</h2><p>Newest booking requests and walk-ins.</p></div></div>
          {bookingRows([...records.records].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, 5))}
        </div>}
        {view === "bookings" && <div className="studio-panel"><div className="section-header"><div><h2>Booking list</h2><p>Open a booking to update its status, bill, advance, or final payment.</p></div><div className="search-field"><Search size={17} /><Input placeholder="Search client or service" value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} aria-label="Search bookings" /></div></div>{bookingRows(listedBookings)}{records.limited && <p className="records-note">Showing the most recent 3,000 bookings.</p>}</div>}
        {view === "finance" && <div className="studio-panel"><div className="section-header"><div><h2>Finance overview</h2><p>Recorded studio income, advances, and unpaid balances.</p></div></div><div className="studio-stats four"><div><span>Completed work value</span><strong>{money(records.metrics.work_value)}</strong></div><div><span>Total received</span><strong>{money(records.metrics.received)}</strong></div><div><span>Advances received</span><strong>{money(records.metrics.advances)}</strong></div><div><span>Outstanding due</span><strong>{money(records.metrics.due)}</strong></div></div><div className="section-header"><div><h2>Due from clients</h2><p>Only active and completed appointments with an unpaid balance.</p></div></div>{bookingRows(records.records.filter((a) => !["cancelled", "no-show"].includes(a.status) && a.total_rupees > a.paid_rupees))}<div className="section-header"><div><h2>Recent payments</h2></div></div>{records.payments.length ? <div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Date</th><th>Client</th><th>Type</th><th>Method</th><th>Amount</th></tr></thead><tbody>{records.payments.slice(0, 30).map((p) => <tr key={p.id}><td>{p.paid_on}</td><td>{p.client_name}</td><td>{p.kind}</td><td>{p.method}</td><td>{money(p.amount_rupees)}</td></tr>)}</tbody></table></div> : <div className="empty-panel">No payments recorded yet.</div>}</div>}
        {view === "calendar" && <div className="studio-panel">
            <div className="bs-calendar"><div className="bs-calendar-top"><div><span className="eyebrow">NEPALI CALENDAR · BIKRAM SAMBAT</span><h2>{bsMonths[bsMonth.month - 1]} {bsMonth.year} BS</h2><p>Red dates have bookings. Select a date to check artists and open times below.</p></div><div className="bs-controls"><button type="button" onClick={() => shiftBsMonth(-1)} aria-label="Previous Nepali month"><ChevronLeft size={18} /></button><button type="button" onClick={() => { setBsMonth(toBik(today())); setDate(today()); }}>Today</button><button type="button" onClick={() => shiftBsMonth(1)} aria-label="Next Nepali month"><ChevronRight size={18} /></button></div></div><div className="bs-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="bs-grid">{Array.from({ length: monthStartOffset }, (_, i) => <span key={"blank" + i} className="bs-blank" />)}{monthCells.map(({ day, ad }) => <button type="button" key={ad} className={(monthCounts[ad] ? "has-booking " : "") + (date === ad ? "selected " : "") + (ad === today() ? "today" : "")} onClick={() => setDate(ad)} aria-label={`${bsMonths[bsMonth.month - 1]} ${day}, ${bsMonth.year}; ${monthCounts[ad] || 0} bookings`}><strong>{day}</strong><small>{new Date(ad + "T12:00:00Z").getUTCDate()} {new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(ad + "T12:00:00Z"))}</small>{Boolean(monthCounts[ad]) && <em>{monthCounts[ad]} booked</em>}</button>)}</div><div className="bs-legend"><span><i className="booked-dot" /> Has booking</span><span><i className="open-dot" /> No booking</span></div></div>
            <div className="studio-stats">
              <div><span>Appointments</span><strong>{booked.length}</strong></div>
              <div><span>Paid toward selected bookings</span><strong>{money(data.appointments.reduce((sum, a) => sum + a.paid_rupees, 0))}</strong></div>
              <div><span>Balance due</span><strong>{money(due)}</strong></div>
            </div>
            <div className="calendar-toolbar"><div className="date-nav"><button onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day"><ChevronLeft /></button><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Calendar date" /><button onClick={() => setDate(shiftDate(date, 1))} aria-label="Next day"><ChevronRight /></button></div><h2>{niceDate(date)}</h2><Button variant="outline" onClick={() => setDate(today())}>Today</Button></div>
            {loading ? <div className="empty-panel">Loading calendar…</div> : !activeStaff.length ? <div className="empty-panel"><h3>Add your first staff member</h3><p>Set their role and working hours in Services & staff, then appointments will appear here.</p></div> :
              <div className="calendar-scroll">
                <div className="calendar-board" style={{ minWidth: 85 + activeStaff.length * 220, "--staff-count": activeStaff.length } as CSSProperties}>
                  <div className="calendar-head"><div className="time-head">TIME</div>{activeStaff.map((member) => <div key={member.id} className="artist-head"><strong>{member.name}</strong><span>{member.role}</span></div>)}</div>
                  <div className="calendar-body">
                    <div className="time-rail" style={{ height: dayHeight }}>{markers.map((mark) => <div key={mark} className="time-marker" style={{ top: (mark - dayStart) / 30 * 58 }}>{time(mark)}</div>)}</div>
                    {activeStaff.map((member) => <div className="artist-lane" key={member.id} style={{ height: dayHeight }}>
                      {data.appointments.filter((a) => a.staff_id === member.id && a.status !== "cancelled").map((a) => <button key={a.id} className={"appointment-block status-" + a.status} style={{ top: (a.start_min - dayStart) / 30 * 58 + 2, height: Math.max(40, (a.end_min - a.start_min) / 30 * 58 - 4) }} onClick={() => setSelected(a)}><strong>{time(a.start_min)} · {a.client_name}</strong><span>{a.service_name}</span><small>{a.status}</small></button>)}
                    </div>)}
                  </div>
                </div>
              </div>}
          </div>}
        {view === "clients" && <div className="studio-panel">
            <div className="section-header"><div><h2>Client records</h2><p>Search past clients and see when they booked and visited.</p></div><div className="search-field"><Search size={17} /><Input className="search-input" placeholder="Search name, phone, or email" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search clients" /></div></div>
            <div className="client-filters"><label>Dates<NativeSelect value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><NativeSelectOption value="all">All time</NativeSelectOption><NativeSelectOption value="7">Last 7 days</NativeSelectOption><NativeSelectOption value="30">Last 30 days</NativeSelectOption><NativeSelectOption value="custom">Custom dates</NativeSelectOption></NativeSelect></label>{clientFilter === "custom" && <><label>Start date<Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label>End date<Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></>}</div>
            {filteredClients.length ? <div className="client-list">{filteredClients.map((person) => <button key={person.id} onClick={() => setClient(person)}><span className="client-avatar">{person.name.charAt(0).toUpperCase()}</span><span><strong>{person.name}</strong><small>{person.phone}</small></span><span className="client-dates"><small>Booked: {person.last_booked || "—"}</small><small>Worked: {person.last_visit || "—"}</small></span><span className="client-visits">{person.visits} booking{person.visits === 1 ? "" : "s"}</span></button>)}</div> : <div className="empty-panel"><h3>No clients found</h3><p>Try another search or date range.</p></div>}
          </div>}
        {view === "staff" && <div className="studio-panel">
            <div className="section-header"><div><h2>Studio setup</h2><p>Add staff, services, and stations. Changes appear on the booking page.</p></div></div>
            <div className="setup-grid">
              <section className="setup-card"><h3>Staff & designations</h3><p>Active staff appear as artist choices on the booking page.</p>
                <label>Name<Input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></label>
                <label>Email<Input type="email" placeholder="artist@example.com" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></label>
                <label>Designation<Input placeholder="Makeup artist, nail technician…" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} /></label>
                <div className="check-row">{["Makeup", "Nails"].map((category) => <label key={category}><input type="checkbox" checked={staffForm.categories.includes(category)} onChange={(e) => setStaffForm({ ...staffForm, categories: e.target.checked ? [...staffForm.categories, category] : staffForm.categories.filter((x) => x !== category) })} /> {category}</label>)}</div>
                <div className="form-pair"><label>Starts<Input type="time" value={staffForm.start} onChange={(e) => setStaffForm({ ...staffForm, start: e.target.value })} /></label><label>Ends<Input type="time" value={staffForm.end} onChange={(e) => setStaffForm({ ...staffForm, end: e.target.value })} /></label></div>
                <div className="check-row weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <label key={day}><input type="checkbox" checked={staffForm.weekdays.includes(index)} onChange={(e) => setStaffForm({ ...staffForm, weekdays: e.target.checked ? [...staffForm.weekdays, index] : staffForm.weekdays.filter((x) => x !== index) })} /> {day}</label>)}</div>
                {staffForm.id > 0 && <label className="inline-check"><input type="checkbox" checked={staffForm.active} onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })} /> Active</label>}
                <Button disabled={saving} onClick={async () => { const saved = await post({ action: staffForm.id ? "updateStaff" : "addStaff", id: staffForm.id, name: staffForm.name, email: staffForm.email, role: staffForm.role, categories: staffForm.categories, startMin: minute(staffForm.start), endMin: minute(staffForm.end), weekdays: staffForm.weekdays, active: staffForm.active }); if (saved) setStaffForm({ id: 0, name: "", email: "", role: "", categories: ["Makeup", "Nails"], start: "10:00", end: "18:00", weekdays: [1, 2, 3, 4, 5, 6], active: true }); }}>{staffForm.id ? "Save staff" : "Add staff"}</Button>
                <div className="setup-list">{data.staff.map((member) => <button key={member.id} onClick={() => setStaffForm({ id: member.id, name: member.name, email: member.email, role: member.role, categories: member.categories.split(","), start: time(member.start_min), end: time(member.end_min), weekdays: member.weekdays.split(",").map(Number), active: Boolean(member.active) })}><strong>{member.name}</strong><small>{member.role} · {member.email || "No email"} · {member.active ? "Active" : "Inactive"}</small></button>)}</div>
              </section>
              <section className="setup-card"><h3>Services</h3><p>Choose the time and price shown to clients.</p>
                <label>Service name<Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} /></label>
                <label>Category<NativeSelect value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}><NativeSelectOption value="Makeup">Makeup</NativeSelectOption><NativeSelectOption value="Nails">Nails</NativeSelectOption></NativeSelect></label>
                <div className="form-pair"><label>Minutes<Input type="number" min="15" step="15" value={serviceForm.durationMin} onChange={(e) => setServiceForm({ ...serviceForm, durationMin: e.target.value })} /></label><label>Price in Rs<Input type="number" min="0" value={serviceForm.priceRupees} onChange={(e) => setServiceForm({ ...serviceForm, priceRupees: e.target.value })} /></label></div>
                <label>Station or room (optional)<NativeSelect value={serviceForm.resourceId} onChange={(e) => setServiceForm({ ...serviceForm, resourceId: e.target.value })}><NativeSelectOption value="">No station limit</NativeSelectOption>{data.resources.filter((r) => r.active).map((r) => <NativeSelectOption key={r.id} value={r.id}>{r.name}</NativeSelectOption>)}</NativeSelect></label>
                {serviceForm.id > 0 && <label className="inline-check"><input type="checkbox" checked={serviceForm.active} onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })} /> Active</label>}
                <Button disabled={saving} onClick={async () => { const saved = await post({ action: serviceForm.id ? "updateService" : "addService", id: serviceForm.id, name: serviceForm.name, category: serviceForm.category, durationMin: Number(serviceForm.durationMin), priceRupees: Number(serviceForm.priceRupees), resourceId: serviceForm.resourceId ? Number(serviceForm.resourceId) : null, active: serviceForm.active }); if (saved) setServiceForm({ id: 0, name: "", category: "Makeup", durationMin: "60", priceRupees: "", resourceId: "", active: true }); }}>{serviceForm.id ? "Save service" : "Add service"}</Button>
                <div className="setup-list">{data.services.map((service) => <button key={service.id} onClick={() => setServiceForm({ id: service.id, name: service.name, category: service.category, durationMin: String(service.duration_min), priceRupees: String(service.price_rupees), resourceId: service.resource_id ? String(service.resource_id) : "", active: Boolean(service.active) })}><strong>{service.name}</strong><small>{service.duration_min} min · {money(service.price_rupees)} · {service.active ? "Active" : "Inactive"}</small></button>)}</div>
              </section>
              <section className="setup-card"><h3>Stations & rooms</h3><p>Services assigned to one station cannot overlap.</p><label>Name<Input placeholder="Nail station 1" value={newResource} onChange={(e) => setNewResource(e.target.value)} /></label><Button disabled={saving} onClick={async () => { const saved = await post({ action: "addResource", name: newResource }); if (saved) setNewResource(""); }}>Add station</Button><div className="setup-list">{data.resources.map((resource) => <div key={resource.id}><strong>{resource.name}</strong></div>)}</div></section>
            </div>
          </div>}
        {view === "profile" && <div className="studio-panel"><div className="section-header"><div><h2>Your profile</h2><p>This is the account currently using the dashboard.</p></div></div><div className="settings-card"><div className="profile-photo-row"><div className="profile-photo">{profile.avatar ? <img src={profile.avatar} alt="Profile" /> : <span>{profile.name.charAt(0)}</span>}</div><div><strong>Profile picture</strong><label className="photo-upload">Upload or change photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void onAvatarFile(e.target.files?.[0])} /></label><small>Square crop, saved with your profile.</small></div></div><div className="form-pair"><label>Name<Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label><label>Role<Input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} /></label></div><div className="form-pair"><label>Email<Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label><label>Phone number<Input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label></div><Button disabled={saving} onClick={() => void saveSettings({ action: "profile", ...profile })}>Save profile</Button></div></div>}
        {view === "security" && <div className="studio-panel"><div className="section-header"><div><h2>Security</h2><p>Update your password and control signed in devices.</p></div></div>{authMethod === "password" ? <><div className="settings-card"><h3>Change password</h3><label>Current password<Input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label><label>New password<Input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label><p>Use at least 12 characters with letters and a number. Other devices will be signed out.</p><Button disabled={saving || !currentPassword || !newPassword} onClick={async () => { if (await saveSettings({ action: "password", currentPassword, newPassword })) { setCurrentPassword(""); setNewPassword(""); } }}>Change password</Button></div><div className="settings-card"><div className="section-header"><div><h3>Signed in devices</h3><p>Review and sign out any other browser session.</p></div><Button variant="outline" disabled={saving || devices.length < 2} onClick={() => void saveSettings({ action: "revokeOthers" })}>Sign out other devices</Button></div><div className="device-list">{devices.map((device) => <div key={device.id}><div><strong>{device.label}{device.current ? " · This device" : ""}</strong><small>Signed in {new Date(device.createdAt * 1000).toLocaleString("en-NP")}</small></div>{!device.current && <button type="button" onClick={() => void saveSettings({ action: "revokeSession", id: device.id })}>Sign out</button>}</div>)}</div></div></> : <div className="settings-card"><h3>ChatGPT sign-in</h3><p>Sign in with the studio email and password to manage passwords and device sessions.</p></div>}</div>}
        {view === "appearance" && <div className="studio-panel"><div className="section-header"><div><h2>Appearance</h2><p>Choose the text density for this dashboard.</p></div></div><div className="settings-card"><label className="inline-check"><input type="checkbox" checked={compactText} onChange={(e) => { setCompactText(e.target.checked); window.localStorage.setItem("usha-studio-compact-text", String(e.target.checked)); }} /> Small text size</label><p>This preference is saved in this browser.</p></div></div>}
      </section>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="booking-dialog"><DialogHeader><DialogTitle>Add booking or walk-in</DialogTitle></DialogHeader>
          <form onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const saved = await post({ action: "addBooking", serviceId: Number(serviceId), staffId: Number(staffId), date: bookingDate, time: bookingTime, name: form.get("name"), phone: form.get("phone"), email: form.get("email"), source: form.get("source"), notes: form.get("notes") }); if (saved) { setBookingOpen(false); setDate(bookingDate); setServiceId(""); setStaffId(""); setBookingTime(""); } }}>
            <label>Booking source<NativeSelect name="source" defaultValue="walk-in"><NativeSelectOption value="walk-in">Walk-in</NativeSelectOption><NativeSelectOption value="phone">Phone</NativeSelectOption><NativeSelectOption value="instagram">Instagram</NativeSelectOption><NativeSelectOption value="online">Online</NativeSelectOption></NativeSelect></label>
            <div className="form-pair"><label>Client name<Input name="name" required /></label><label>Phone<Input name="phone" type="tel" required /></label></div>
            <label>Email (optional)<Input name="email" type="email" /></label>
            <label>Service<NativeSelect value={serviceId} onChange={(e) => { setServiceId(e.target.value); setStaffId(""); }} required><NativeSelectOption value="">Choose a service</NativeSelectOption>{activeServices.map((service) => <NativeSelectOption key={service.id} value={service.id}>{service.name} · {money(service.price_rupees)}</NativeSelectOption>)}</NativeSelect></label>
            <label>Artist<NativeSelect value={staffId} onChange={(e) => setStaffId(e.target.value)} required><NativeSelectOption value="">Choose an artist</NativeSelectOption>{eligibleStaff.map((member) => <NativeSelectOption key={member.id} value={member.id}>{member.name}</NativeSelectOption>)}</NativeSelect></label>
            <div className="form-pair"><label>Date<Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required /></label><label>Time<Input type="time" step="900" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required /></label></div>
            {slots.length > 0 && <div className="quick-slots"><span>Open times</span>{slots.slice(0, 8).map((slot) => <button key={slot} type="button" onClick={() => setBookingTime(slot)}>{slot}</button>)}</div>}
            <label>Studio notes (optional)<Textarea name="notes" rows={2} /></label>
            <Button type="submit" disabled={saving || !bookingTime}>Save appointment</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{selected?.client_name}</SheetTitle><p>{selected?.client_phone}</p></SheetHeader>
          {selected && <div className="sheet-scroll">
            <div className="detail-summary"><strong>{selected.service_name}</strong><span>{niceDate(selected.date)} at {time(selected.start_min)}</span><span>{selected.staff_name} · {selected.source}</span></div>
            <label className="field-label">Appointment status</label>
            <NativeSelect value={selected.status} onChange={async (e) => { await post({ action: "appointmentStatus", id: selected.id, status: e.target.value }); }}>
              {["confirmed", "completed", "cancelled", "no-show"].map((status) => <NativeSelectOption key={status} value={status}>{status}</NativeSelectOption>)}
            </NativeSelect>
            <div className="sheet-section settlement-box"><h3>Finish this appointment</h3><label className="inline-check"><input type="checkbox" checked={receiveFull} onChange={(e) => setReceiveFull(e.target.checked)} /> Full remaining amount received ({money(Math.max(0, selected.total_rupees - selected.paid_rupees))})</label><label>Payment method<NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{["cash", "QR", "bank", "card", "other"].map((method) => <NativeSelectOption key={method} value={method}>{method}</NativeSelectOption>)}</NativeSelect></label><Button disabled={saving || ["cancelled", "no-show"].includes(selected.status) || selected.date > today()} onClick={async () => { const saved = await post({ action: "completeAndSettle", id: selected.id, receiveFull, method: paymentMethod }); if (saved) { setReceiveFull(false); const r = await fetch("/api/studio?mode=client&clientId=" + selected.client_id); setHistory(await r.json() as History); } }}>{receiveFull ? "Mark complete & record final payment" : "Mark work complete"}</Button></div>
            <div className="sheet-section"><h3><ReceiptText size={18} /> Bill and balance</h3>
              <div className="bill-row"><span>Service</span><strong>{money(selected.subtotal_rupees)}</strong></div>
              <div className="form-pair"><label>Discount (Rs)<Input type="number" min="0" max={selected.subtotal_rupees} value={discount} onChange={(e) => setDiscount(e.target.value)} /></label><label>Due date<Input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} /></label></div>
              <Button variant="outline" onClick={() => post({ action: "updateBill", appointmentId: selected.id, discountRupees: Number(discount), dueOn })} disabled={saving}>Save bill</Button>
              <div className="bill-row"><span>Total</span><strong>{money(selected.total_rupees)}</strong></div>
              <div className="bill-row"><span>Paid</span><strong>{money(selected.paid_rupees)}</strong></div>
              <div className="bill-row balance"><span>Balance due</span><strong>{money(Math.max(0, selected.total_rupees - selected.paid_rupees))}</strong></div>
              <a className="receipt-link" href={"/studio/receipt/" + selected.id} target="_blank" rel="noreferrer">Open branded receipt ↗</a>
            </div>
            <div className="sheet-section"><h3>Record an advance or payment</h3>
              <label>Payment type<NativeSelect value={paymentKind} onChange={(e) => setPaymentKind(e.target.value)}><NativeSelectOption value="advance">Advance</NativeSelectOption><NativeSelectOption value="payment">Other payment</NativeSelectOption><NativeSelectOption value="final">Final payment</NativeSelectOption></NativeSelect></label>
              <div className="form-pair"><label>Amount (Rs)<Input type="number" min="1" max={Math.max(0, selected.total_rupees - selected.paid_rupees)} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></label><label>Paid on<Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></label></div>
              <label>Method<NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{["cash", "QR", "bank", "card", "other"].map((method) => <NativeSelectOption key={method} value={method}>{method}</NativeSelectOption>)}</NativeSelect></label>
              <label>Reference (optional)<Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} /></label>
              <Button disabled={saving || !paymentAmount || selected.total_rupees <= selected.paid_rupees} onClick={async () => { const saved = await post({ action: "addPayment", billId: selected.bill_id, amountRupees: Number(paymentAmount), kind: paymentKind, method: paymentMethod, paidOn: paymentDate, reference: paymentReference }); if (saved) { setPaymentAmount(""); setPaymentReference(""); const r = await fetch("/api/studio?mode=client&clientId=" + selected.client_id); setHistory(await r.json() as History); } }}>Record payment</Button>
              <div className="payment-list">{billPayments.map((p) => <div key={p.id}><strong>{money(p.amount_rupees)}</strong><span>{p.paid_on} · {p.method}{p.reference ? " · " + p.reference : ""}</span><label>Type<NativeSelect value={p.kind} onChange={async (event) => { if (await post({ action: "updatePaymentKind", id: p.id, billId: p.bill_id, kind: event.target.value })) { const r = await fetch("/api/studio?mode=client&clientId=" + selected.client_id); setHistory(await r.json() as History); } }}><NativeSelectOption value="advance">Advance</NativeSelectOption><NativeSelectOption value="payment">Other payment</NativeSelectOption><NativeSelectOption value="final">Final payment</NativeSelectOption></NativeSelect></label></div>)}</div>
            </div>
          </div>}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(client)} onOpenChange={(open) => { if (!open) setClient(null); }}>
        <SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{client?.name}</SheetTitle><p>{client?.phone}</p></SheetHeader>
          {client && <div className="sheet-scroll">
            <div className="detail-summary"><strong>{client.visits} booking{client.visits === 1 ? "" : "s"}</strong><span>{client.email || "No email recorded"}</span></div>
            <div className="sheet-section"><h3>Client notes</h3><Textarea rows={4} value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Preferences or relevant studio notes" /><Button onClick={() => post({ action: "updateClient", id: client.id, notes: clientNotes, email: client.email || "" })} disabled={saving}>Save notes</Button></div>
            <div className="sheet-section"><h3>Appointment history</h3><div className="history-list">{history.history.map((a) => <div key={a.id}><strong>{a.service_name}</strong><span>Booked {a.created_at?.slice(0, 10)} · Appointment {a.date} at {time(a.start_min)} · {a.status}</span>{a.status === "completed" && <span>Worked {a.date}</span>}<small>{money(a.paid_rupees)} paid / {money(a.total_rupees)} total</small></div>)}</div></div>
          </div>}
        </SheetContent>
      </Sheet>
    </main>
  );
}
