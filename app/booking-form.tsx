"use client";

import { useState, type FormEvent } from "react";
import SiteFooter from "@/components/site-footer";
import PageFaq from "@/components/page-faq";
import { portfolioCategories } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const PHONE = "+9779817077567";
const WHATSAPP = "https://wa.me/9779817077567";

export default function BookingForm() {
  const [makeoverType, setMakeoverType] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const service = portfolioCategories.find((item) => item.slug === makeoverType)?.title || "Makeup appointment";
    const message = [
      "Hi Usha, I would like to book an appointment.",
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      `Service: ${service}`,
      date ? `Preferred date: ${date}` : null,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
    ].filter(Boolean).join("\n");
    window.open(`${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="booking-page booking-detail-page">
      <a className="booking-back" href="/">← Back to Usha Makeup and Nails</a>
      <section className="booking-layout" id="booking" aria-label="Book an appointment">
        <section className="booking-panel" aria-labelledby="booking-title">
          <form onSubmit={submit}>
            <h1 id="booking-title">Find your time at Usha.</h1>
            <p className="intro">Share a few details and continue on WhatsApp. Usha will confirm your appointment personally.</p>
            <div className="step-heading"><h2>Your details</h2></div>
            <div className="client-fields">
              <label>Full name<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></label>
              <label>Phone number<Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={25} required /></label>
            </div>
            <div className="step-heading second"><h2>Choose your makeover</h2></div>
            <label className="field-label booking-service-type" htmlFor="service-type">Service type</label>
            <NativeSelect id="service-type" className="booking-select" value={makeoverType} onChange={(event) => setMakeoverType(event.target.value)} required>
              <NativeSelectOption value="">Select a service type</NativeSelectOption>
              {portfolioCategories.map((item) => <NativeSelectOption key={item.slug} value={item.slug}>{item.title}</NativeSelectOption>)}
            </NativeSelect>
            <label className="field-label date-label" htmlFor="date">Preferred date (optional)</label>
            <div className="date-box"><Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <label className="field-label date-label" htmlFor="notes">Anything we should know? (optional)</label>
            <Input id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} />
            <Button className="booking-button" type="submit">Continue on WhatsApp</Button>
            <p className="field-help">Or call <a href={`tel:${PHONE}`}>+977 9817077567</a></p>
          </form>
        </section>
      </section>
      <PageFaq id="booking-questions" title="Booking Questions" items={[
        { question: "How much deposit is required to book?", answer: <>Please contact Usha at <a href={`tel:${PHONE}`}>+977 9817077567</a> to confirm the advance amount and payment details for your booking.</> },
        { question: "What is your cancellation policy?", answer: "If you need to cancel or change your appointment, please contact Usha. Confirm cancellation and rescheduling terms with the studio before booking." },
        { question: "How long does bridal makeup take?", answer: "Contact Usha to discuss your bridal look and the time needed to get ready." },
      ]} />
      <SiteFooter currentPage="booking" />
    </main>
  );
}
