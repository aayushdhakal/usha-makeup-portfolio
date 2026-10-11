import type { ReactNode } from "react";

export type FaqItem = { question: string; answer: ReactNode };

export default function PageFaq({ id, title, mobileTitle, items }: { id: string; title: string; mobileTitle?: string; items: FaqItem[] }) {
  return (
    <section className="booking-faq" aria-labelledby={`${id}-title`}>
      <p className="booking-faq-kicker">Questions</p>
      <h2 id={`${id}-title`}>{mobileTitle ? <><span className="faq-title-desktop">{title}</span><span className="faq-title-mobile">{mobileTitle}</span></> : title}</h2>
      <div className="booking-faq-list">
        {items.map(({ question, answer }, index) => (
          <details name={id} open={index === 0} key={question}>
            <summary>{question}<span aria-hidden="true">+</span></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
