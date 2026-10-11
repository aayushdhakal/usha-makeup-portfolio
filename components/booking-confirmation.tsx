"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type BookingConfirmationProps = {
  service: string;
  date: string;
  time: string;
  artist: string;
  reference: string;
  onBookAnother: () => void;
};

export default function BookingConfirmation({ service, date, time, artist, reference, onBookAnother }: BookingConfirmationProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className="booking-success" role="status">
      <div className="booking-success-icon" aria-hidden="true"><CircleCheck /></div>
      <h1 id="booking-title" ref={heading} tabIndex={-1}>Booking confirmed!</h1>
      <p className="booking-success-intro">Your appointment has been successfully booked.</p>
      <dl className="booking-success-details">
        <div><dt>Service</dt><dd>{service}</dd></div>
        <div><dt>Date</dt><dd>{formattedDate}</dd></div>
        <div><dt>Time</dt><dd>{time}</dd></div>
        <div><dt>Artist</dt><dd>{artist}</dd></div>
      </dl>
      <p className="booking-reference">Booking reference <strong>{reference.slice(0, 8).toUpperCase()}</strong></p>
      <p className="booking-success-note">We look forward to seeing you at Usha Makeup and Nails.</p>
      <Button className="booking-success-button" onClick={onBookAnother}>Book another appointment</Button>
    </div>
  );
}
