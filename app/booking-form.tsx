"use client";

import { useEffect, useState } from "react";
import SiteFooter from "@/components/site-footer";
import BookingConfirmation from "@/components/booking-confirmation";
import PageFaq from "@/components/page-faq";
import { portfolioCategories } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Service = { id: number; name: string; category: string; duration_min: number; price_rupees: number };
type Staff = { id: number; name: string; role: string; categories: string };
type ModelContext = { registerTool: (tool: Record<string, unknown>, options: { signal: AbortSignal }) => void | Promise<void> };
const money = (value: number) => "Rs " + value.toLocaleString("en-NP");
const nepalDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return get("year") + "-" + get("month") + "-" + get("day");
};

export default function BookingForm() {
  const [makeoverType, setMakeoverType] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(nepalDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const makeupServices = services.filter((service) => service.category === "Makeup");
  const serviceKeyword = makeoverType.includes("reception") ? "reception" : makeoverType.includes("wedding-shoot") ? "shoot" : makeoverType.includes("special-occasion") ? "occasion" : makeoverType.split("-")[0];
  const matchingServices = makeupServices.filter((service) => service.name.toLowerCase().includes(serviceKeyword));
  const offeredServices = matchingServices.length ? matchingServices : makeupServices;
  const timeRange = (slot: string) => {
    const [hour, minute] = slot.split(":").map(Number);
    const end = hour * 60 + minute + (selected?.duration_min || 0);
    return `${slot} – ${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  };
  const selected = services.find((service) => String(service.id) === serviceId);
  const eligible = staff.filter((person) => person.categories.split(",").includes("Makeup"));

  useEffect(() => {
    fetch("/api/catalog").then(async (response) => {
      if (!response.ok) throw new Error("Booking is temporarily unavailable.");
      return response.json() as Promise<{ services: Service[]; staff: Staff[] }>;
    }).then((data) => { setServices(data.services || []); setStaff(data.staff || []); })
      .catch((cause) => setError(cause.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("usha-booking-contact");
      if (!saved) return;
      const contact = JSON.parse(saved) as { firstName?: string; lastName?: string; phone?: string };
      setName([contact.firstName, contact.lastName].filter(Boolean).join(" "));
      setPhone(contact.phone || "");
    } catch {
      // Visitors can still complete the booking form directly.
    }
  }, []);

  useEffect(() => {
    if (confirmation) return;
    setTime("");
    if (!serviceId || !staffId || !date) { setSlots([]); return; }
    const controller = new AbortController();
    const params = new URLSearchParams({ serviceId, staffId, date });
    fetch("/api/availability?" + params, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ slots: string[] }>)
      .then((data) => setSlots(data.slots || []))
      .catch((cause) => { if (cause.name !== "AbortError") setError("Available times could not be loaded."); });
    return () => controller.abort();
  }, [serviceId, staffId, date, confirmation]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Record<string, unknown>) => {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
    };
    register({
      name: "find_available_times", title: "Find available appointment times",
      description: "Read available times for a configured service, artist, and date at Usha Makeup and Nails.",
      inputSchema: { type: "object", properties: { serviceId: { type: "integer" }, staffId: { type: "integer" }, date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } }, required: ["serviceId", "staffId", "date"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as { serviceId?: number; staffId?: number; date?: string };
        if (!Number.isInteger(value?.serviceId) || !Number.isInteger(value?.staffId) || !/^\d{4}-\d{2}-\d{2}$/.test(value?.date || "")) throw new Error("A service, artist, and date are required.");
        const response = await fetch("/api/availability?" + new URLSearchParams({ serviceId: String(value.serviceId), staffId: String(value.staffId), date: value.date! }));
        if (!response.ok) throw new Error("Availability could not be loaded.");
        const result = await response.json() as { slots: string[] };
        setServiceId(String(value.serviceId)); setStaffId(String(value.staffId)); setDate(value.date!); setSlots(result.slots);
        return { slots: result.slots };
      },
    });
    register({
      name: "create_booking", title: "Create appointment",
      description: "Create a client appointment for a selected service, artist, date, and open time.",
      inputSchema: { type: "object", properties: { serviceId: { type: "integer" }, staffId: { type: "integer" }, date: { type: "string" }, time: { type: "string" }, name: { type: "string" }, phone: { type: "string" }, email: { type: "string" } }, required: ["serviceId", "staffId", "date", "time", "name", "phone"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as { serviceId?: number; staffId?: number; date?: string; time?: string; name?: string; phone?: string; email?: string };
        if (!Number.isInteger(value?.serviceId) || !Number.isInteger(value?.staffId) || !value?.date || !value?.time || !value?.name || !value?.phone) throw new Error("Complete booking details are required.");
        const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
        const result = await response.json() as { id?: string; error?: string };
        if (!response.ok || !result.id) throw new Error(result.error || "The appointment could not be created.");
        setServiceId(String(value.serviceId)); setStaffId(String(value.staffId)); setDate(value.date); setTime(value.time); setName(value.name); setPhone(value.phone); setEmail(value.email || ""); setConfirmation(result.id);
        return { id: result.id, status: "confirmed" };
      },
    });
    return () => lifecycle.abort();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !staffId || !time) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: Number(serviceId), staffId: Number(staffId), date, time, name, phone, email, website, makeoverType }),
      });
      const data = await response.json() as { id: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Your booking could not be placed.");
      setConfirmation(data.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your booking could not be placed."); }
    finally { setBusy(false); }
  }

  return (
    <main className={`booking-page booking-detail-page${confirmation ? " booking-confirmation-page" : ""}`}>
      <a className="booking-back" href="/">← Back to Usha Makeup and Nails</a>
      <section className="booking-layout" id="booking" aria-label="Book an appointment">
        <section className="booking-panel" aria-labelledby="booking-title">
          {confirmation ? (
            <BookingConfirmation
              service={selected?.name || "Makeup appointment"}
              date={date}
              time={timeRange(time)}
              artist={staff.find((person) => String(person.id) === staffId)?.name || "Your selected artist"}
              reference={confirmation}
              onBookAnother={() => window.location.reload()}
            />
          ) : (
            <form onSubmit={submit}>
              <h1 id="booking-title">Find your time at Usha.</h1>
              <p className="intro">Choose a service and a convenient time. Our team will take care of the rest.</p>
              <div className="step-heading"><h2>Your details</h2></div>
              <div className="client-fields">
                <label>Full name<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></label>
                <label>Phone number<Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={25} required /></label>
                <label>Email (optional)<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={150} /></label>
              </div>
              <div className="step-heading second"><h2>Choose your makeover</h2></div>
              <label className="field-label booking-service-type" htmlFor="service-type">Service type</label>
              <NativeSelect id="service-type" className="booking-select" value={makeoverType} onChange={(event) => {
                const value = event.target.value;
                setMakeoverType(value);
                const keyword = value.includes("reception") ? "reception" : value.includes("wedding-shoot") ? "shoot" : value.includes("special-occasion") ? "occasion" : value.split("-")[0];
                const matches = makeupServices.filter((service) => service.name.toLowerCase().includes(keyword));
                const options = matches.length ? matches : makeupServices;
                setServiceId(value && options.length === 1 ? String(options[0].id) : ""); setStaffId("");
              }} required>
                <NativeSelectOption value="">Select a service type</NativeSelectOption>
                {portfolioCategories.map((item) => <NativeSelectOption key={item.slug} value={item.slug}>{item.title}</NativeSelectOption>)}
              </NativeSelect>
              {makeoverType && offeredServices.length > 1 && <label className="field-label date-label">Service<NativeSelect className="booking-select" value={serviceId} onChange={(event) => { setServiceId(event.target.value); setStaffId(""); }} required>
                <NativeSelectOption value="">Select a service</NativeSelectOption>
                {offeredServices.map((service) => <NativeSelectOption key={service.id} value={service.id}>{service.name} · {service.duration_min} min · {money(service.price_rupees)}</NativeSelectOption>)}
              </NativeSelect></label>}
              {makeoverType && !offeredServices.length && <p className="field-help">{loading ? "Loading services…" : "Online booking is being set up. Please contact us to book."}</p>}
              <div className="booking-schedule">
              <div className="booking-artist-date">
              <div className="step-heading second"><h2>Choose an artist and date</h2></div>
              <label className="field-label" htmlFor="artist">Artist</label>
              <NativeSelect id="artist" className="booking-select" value={staffId} onChange={(event) => setStaffId(event.target.value)} disabled={!selected} required>
                <NativeSelectOption value="">Select an artist</NativeSelectOption>
                {eligible.map((person) => <NativeSelectOption key={person.id} value={person.id}>{person.name} · {person.role}</NativeSelectOption>)}
              </NativeSelect>
              {selected && !eligible.length && <p className="field-help">No artist is available for this service yet.</p>}
              <label className="field-label date-label" htmlFor="date">Date</label>
              <div className="date-box"><Input id="date" type="date" value={date} min={nepalDate()} onChange={(event) => setDate(event.target.value)} required /></div>
              </div>
              <div className="booking-time-options">
              <div className="step-heading second"><h2>Choose a time range</h2></div>
              {serviceId && staffId ? (
                slots.length ? <div className="slot-grid">{slots.map((slot) => <button key={slot} type="button" className={time === slot ? "slot active" : "slot"} onClick={() => setTime(slot)} aria-pressed={time === slot}>{timeRange(slot)}</button>)}</div>
                  : <div className="availability"><span>No open times on this date. Try another day.</span></div>
              ) : <div className="availability"><span>Choose a service and artist to see open times.</span></div>}
              </div>
              </div>
              <input className="honeypot" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {error && <p className="form-error" role="alert">{error}</p>}
              <Button className="booking-button" type="submit" disabled={!selected || !staffId || !time || busy}>{busy ? "Placing booking…" : "Confirm appointment"}</Button>
            </form>
          )}
        </section>

      </section>
      <PageFaq id="booking-questions" title="Booking Questions" items={[
        { question: "How much deposit is required to book?", answer: <>Please contact Usha at <a href="tel:+9779817077567">+977 9817077567</a> to confirm the advance amount and payment details for your booking.</> },
        { question: "What is your cancellation policy?", answer: "If you need to cancel or change your appointment, please contact Usha. Confirm cancellation and rescheduling terms with the studio before booking." },
        { question: "How long does bridal makeup take?", answer: "The available time ranges show the duration reserved for your selected service. Contact Usha to discuss your bridal look and the time needed to get ready." },
      ]} />
      <SiteFooter currentPage="booking" />
    </main>
  );
}
