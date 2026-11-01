"use client";

import { useEffect, useState, type FormEvent } from "react";
import SiteFooter from "@/components/site-footer";
import PageFaq from "@/components/page-faq";
import { portfolioCategories } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const PHONE = "+9779817077567";


export default function BookingForm() {
  const [makeoverType, setMakeoverType] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const API = process.env.NEXT_PUBLIC_OS_API_URL || "https://login.ushamakeup.com/api";
  const [formToken,setFormToken]=useState("");
  const [types,setTypes]=useState<{id:number;name:string}[]>([]);
  const [email,setEmail]=useState("");
  const [time,setTime]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [reference,setReference]=useState("");
  useEffect(()=>{Promise.all([fetch(API+"/booking-form",{credentials:"omit"}).then(r=>r.json()),fetch(API+"/booking-types",{credentials:"omit"}).then(r=>r.json())]).then(([token,list])=>{setFormToken(token.data.formToken);setTypes(list.data);}).catch(()=>setError("Booking requests are temporarily unavailable. Please call the studio."));},[API]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const service = portfolioCategories.find((item) => item.slug === makeoverType)?.title || "Makeup appointment";
    const aliases:Record<string,RegExp>={"bridal-makeup":/bridal/i,"pre-post-reception-makeup":/reception/i,"engagement-makeup":/engagement/i,"mehendi-makeup":/meh[ae]ndi/i,"post-pre-wedding-shoot-makeup":/photoshoot|photo shoot|wedding shoot/i,"birthday-anniversary-special-occasion-makeup":/party|special occasion/i};
    const type=types.find(t=>aliases[makeoverType]?.test(t.name));
    if(!type){setError("This service is not available for online requests yet. Please call the studio.");return;}
    setBusy(true);setError("");
    try{const response=await fetch(API+"/bookings/request",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:name.trim(),phone:phone.trim(),email:email.trim()||undefined,bookingTypeId:type.id,date,time,locationType:"STUDIO",description:["Requested service: "+service,notes.trim()].filter(Boolean).join("\n"),formToken})});const result=await response.json();if(!response.ok||result.error)throw new Error(result.error?.message||"Could not send the request. Please try again.");setReference(result.data.referenceCode);}catch(e){setError(e instanceof Error?e.message:"Could not send the request. Please try again.");}finally{setBusy(false);}

  }

  return (
    <main className="booking-page booking-detail-page">
      <a className="booking-back" href="/">← Back to Usha Makeup and Nails</a>
      <section className="booking-layout" id="booking" aria-label="Book an appointment">
        <section className="booking-panel" aria-labelledby="booking-title">
          <form onSubmit={submit}>
            {reference ? <div role="status"><h1>Request received</h1><p>Your reference: <strong>{reference}</strong>. The studio will contact you to confirm your appointment.</p><a href="/">Back to home</a></div> : <>
            <h1 id="booking-title">Find your time at Usha.</h1>
            <p className="intro">Send your preferred service, date and time to the studio. Your appointment is confirmed after Usha reviews your request.</p>
            <div className="step-heading"><h2>Your details</h2></div>
            <div className="client-fields">
              <label>Full name<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></label>
              <label>Phone number<Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={25} required /></label>
            <label>Email (optional)<Input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} /></label></div>
            <div className="step-heading second"><h2>Choose your makeover</h2></div>
            <label className="field-label booking-service-type" htmlFor="service-type">Service type</label>
            <NativeSelect id="service-type" className="booking-select" value={makeoverType} onChange={(event) => setMakeoverType(event.target.value)} required>
              <NativeSelectOption value="">Select a service type</NativeSelectOption>
              {portfolioCategories.map((item) => <NativeSelectOption key={item.slug} value={item.slug}>{item.title}</NativeSelectOption>)}
            </NativeSelect>
            <label className="field-label date-label" htmlFor="date">Preferred date</label>
            <div className="date-box"><Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required min={new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kathmandu",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())} /></div>
            <label className="field-label date-label" htmlFor="time">Preferred start time</label><Input id="time" type="time" value={time} onChange={e=>setTime(e.target.value)} required max="20:59" /><p className="field-help">Services last 3 hours. The studio will confirm availability.</p>
            <label className="field-label date-label" htmlFor="notes">Anything we should know? (optional)</label>
            <Input id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} />
            {error&&<p role="alert">{error}</p>}<Button className="booking-button" type="submit" disabled={busy||!formToken}>{busy?"Sending…":"Send booking request"}</Button>
            <p className="field-help">Or call <a href={`tel:${PHONE}`}>+977 9817077567</a></p>
          </>}
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
