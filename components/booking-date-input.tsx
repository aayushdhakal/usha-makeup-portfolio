"use client";
import {useEffect,useState} from 'react';
import {BS_MONTHS,adToBs,bsToAd,bsMonthLength,formatDual,todayKtm} from '@/lib/booking-dates';
import {Input} from '@/components/ui/input';
export function BookingDateInput({value,onChange,id="date"}:{value:string;onChange:(date:string)=>void;id?:string}){
 const [mode,setMode]=useState<'BS'|'AD'>('BS');
 const today=todayKtm(), bs=adToBs(value||today), current=adToBs(today);
 useEffect(()=>{if(!value)onChange(today);},[value,today,onChange]);
 const setBs=(year:number,month:number,day:number)=>{const iso=bsToAd(year,month,Math.min(day,bsMonthLength(year,month)||30));if(iso)onChange(iso);};
 return <div className="public-booking-date"><div className="public-booking-date-heading"><span>{mode==='BS'?'Nepali date (BS)':'English date (AD)'}</span><div role="group" aria-label="Calendar">{(['BS','AD'] as const).map(m=><button key={m} type="button" aria-pressed={mode===m} onClick={()=>setMode(m)}>{m}</button>)}</div></div>{mode==='AD'?<Input id={id} aria-label="Preferred date AD" type="date" value={value} min={today} required onChange={e=>onChange(e.target.value)} />:bs&&current?<div className="public-booking-bs-fields"><select id={id} aria-label="BS year" value={bs.year} onChange={e=>setBs(+e.target.value,bs.month,bs.day)}>{Array.from({length:Math.min(2090,current.year+3)-current.year+1},(_,i)=>current.year+i).map(y=><option key={y}>{y}</option>)}</select><select aria-label="BS month" value={bs.month} onChange={e=>setBs(bs.year,+e.target.value,bs.day)}>{BS_MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select><select aria-label="BS day" value={bs.day} onChange={e=>setBs(bs.year,bs.month,+e.target.value)}>{Array.from({length:bsMonthLength(bs.year,bs.month)||30},(_,i)=>i+1).map(d=><option key={d}>{d}</option>)}</select></div>:<p>This date is outside the BS calendar. Switch to AD.</p>}{value&&<p className="field-help">{formatDual(value)}</p>}{value<today&&<p role="alert">Please choose today or a future date.</p>}</div>;
}
