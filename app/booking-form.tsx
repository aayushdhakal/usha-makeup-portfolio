"use client";
import {useEffect,useState,type FormEvent} from 'react';
import SiteFooter from '@/components/site-footer';
import PageFaq from '@/components/page-faq';
import {BookingDateInput} from '@/components/booking-date-input';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
const PHONE='+9779817077567';
type Service={key:string;kind:'EVENT'|'GUEST';date:string;time:string;bookingTypeId:string;locationType:'STUDIO'|'HOME';address:string;description:string};
type Type={id:number;name:string};
const blank=():Service=>({key:crypto.randomUUID(),kind:'EVENT',date:'',time:'',bookingTypeId:'',locationType:'STUDIO',address:'',description:''});
function ServiceFields({value,onChange,types,index}:{value:Service;onChange:(s:Service)=>void;types:Type[];index:number}){
 const set=(key:keyof Service,v:string)=>onChange({...value,[key]:v});
 return <div className="visitor-service-fields">
 <label className="field-label" htmlFor={`date-${value.key}`}>Date &amp; time</label><BookingDateInput id={`date-${value.key}`} value={value.date} onChange={date=>onChange({...value,date})} />
 <label className="field-label">Preferred start time<Input aria-label={`Service ${index+1} start time`} type="time" required max="20:59" value={value.time} onChange={e=>set('time',e.target.value)} /></label>
 <label className="field-label">Booking type<select aria-label="Booking type" required disabled={!types.length} value={value.bookingTypeId} onChange={e=>set('bookingTypeId',e.target.value)}><option value="">Select a service type</option>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
 <label className="field-label">Location<select aria-label="Location" value={value.locationType} onChange={e=>set('locationType',e.target.value)}><option value="STUDIO">At studio</option><option value="HOME">Home / venue</option></select></label>
 {value.locationType==='HOME'&&<label className="field-label">Home / venue address<Input required value={value.address} maxLength={255} onChange={e=>set('address',e.target.value)} /></label>}
 <label className="field-label">Notes (optional)<Input value={value.description} maxLength={300} onChange={e=>set('description',e.target.value)} /></label>
 </div>;
}
export default function BookingForm(){
 const API=process.env.NEXT_PUBLIC_OS_API_URL||'https://login.ushamakeup.com/api';
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState('');
 const [services,setServices]=useState<Service[]>([]),[requestId,setRequestId]=useState('');
 const [types,setTypes]=useState<Type[]>([]),[token,setToken]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[reference,setReference]=useState('');
 useEffect(()=>{setServices([blank()]);setRequestId(crypto.randomUUID());const load=()=>fetch(API+'/booking-types',{credentials:'omit',cache:'no-store'}).then(r=>r.json()).then(result=>{if(!Array.isArray(result.data))throw new Error();setTypes(result.data);}).catch(()=>setError('Cannot load services. Please try again or call the studio.'));load();fetch(API+'/booking-form',{credentials:'omit'}).then(r=>r.json()).then(r=>setToken(r.data.formToken)).catch(()=>setError('Cannot connect to the studio. Please try again.'));window.addEventListener('focus',load);const timer=setInterval(load,60000);return()=>{window.removeEventListener('focus',load);clearInterval(timer);};},[API]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');try{const response=await fetch(API+'/bookings/request',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,fullName:name.trim(),phone:phone.trim(),email:email.trim(),formToken:token,services:services.map(({key,...service})=>({...service,bookingTypeId:Number(service.bookingTypeId)}))})});const result=await response.json();if(!response.ok||result.error)throw new Error(result.error?.message||'Could not send request. Please try again.');setReference(result.data.referenceCode);document.getElementById('booking')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){setError(e instanceof Error?e.message:'Could not send request.');}finally{setBusy(false);}}
 const change=(index:number,service:Service)=>setServices(list=>list.map((s,i)=>i===index?service:s));
 let events=1,guests=0;
 return (<main className="booking-page booking-detail-page visitor-booking-page"><a className="booking-back" href="/">← Back to Usha Makeup and Nails</a>
 <section className="booking-layout" id="booking" aria-label="Book an appointment"><section className={`booking-panel${reference?' booking-panel-success':''}`} aria-labelledby={reference?'booking-success-title':'booking-title'}>
 {reference?<div className="booking-request-success" role="status"><span className="booking-success-icon" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><circle className="booking-success-ring" cx="32" cy="32" r="29" /><path className="booking-success-check" d="M19 33l9 9 18-21" /></svg></span><h1 id="booking-success-title">Your booking request is sent</h1><p>Your reference: <strong>{reference}</strong></p><p>The studio will contact you to confirm your appointment.</p><a className="booking-success-home" href="/">Back to home</a></div>:<form onSubmit={submit}>
 <h1 id="booking-title">Book your appointment</h1><p className="intro">Share your details and preferred services. The studio will contact you to confirm availability.</p>
 <div className="visitor-client-fields"><label>Full Name<Input required value={name} maxLength={100} onChange={e=>setName(e.target.value)} /></label><label>Phone<Input required type="tel" value={phone} maxLength={25} onChange={e=>setPhone(e.target.value)} /></label><label>Email<Input required type="email" value={email} maxLength={254} onChange={e=>setEmail(e.target.value)} /></label></div>
 {services[0]&&<ServiceFields value={services[0]} onChange={v=>change(0,v)} types={types} index={0} />}
 <section className="visitor-additional"><h2>Do you have another event or a guest?</h2><p>Add each service here. Guest names are optional.</p>
 {services.slice(1).map((service,i)=>{const label=service.kind==='GUEST'?`Guest ${++guests}`:`${++events}${events===2?'nd':events===3?'rd':'th'} event`;return <section className="visitor-extra-service" key={service.key}><div className="visitor-extra-heading"><h3>{label}</h3><button type="button" onClick={()=>setServices(list=>list.filter(s=>s.key!==service.key))} aria-label={`Remove ${label}`}>Remove</button></div><label className="field-label">Additional service for<select value={service.kind} onChange={e=>change(i+1,{...service,kind:e.target.value as Service['kind']})}><option value="EVENT">Another event</option><option value="GUEST">Guest</option></select></label><ServiceFields value={service} onChange={v=>change(i+1,v)} types={types} index={i+1} /></section>;})}
 <Button type="button" disabled={services.length>=12} onClick={()=>setServices(list=>[...list,{...blank(),date:list[0]?.date||''}])}>+ Add another event / guest</Button></section>
 {error&&<p role="alert">{error}</p>}<Button className="booking-button" type="submit" disabled={busy||!token||!services.length}>{busy?'Sending…':'Send booking request'}</Button></form>}
 </section></section>
      <PageFaq id="booking-questions" title="Booking Questions" items={[
        { question: "How much deposit is required to book?", answer: <>Please contact Usha at <a href={`tel:${PHONE}`}>+977 9817077567</a> to confirm the advance amount and payment details for your booking.</> },
        { question: "What is your cancellation policy?", answer: "If you need to cancel or change your appointment, please contact Usha. Confirm cancellation and rescheduling terms with the studio before booking." },
        { question: "How long does bridal makeup take?", answer: "Contact Usha to discuss your bridal look and the time needed to get ready." },
      ]} />
      <SiteFooter currentPage="booking" />
    </main>
  );
}
