"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>([
      ".usha-home .usha-section-heading",
      ".usha-home .usha-makeover-list",
      ".usha-home .usha-makeover-carousel",
      ".usha-home .about-content > *",
      ".usha-home .usha-testimonials-heading",
      ".usha-home .usha-testimonial-card",
      ".usha-home .contact-brand",
      ".usha-home .contact-navigation",
      ".usha-home .contact-follow",
      ".usha-home .contact-side",
      ".usha-home .contact-bottom",
      ".portfolio-page .portfolio-heading",
      ".portfolio-page .portfolio-gallery-item",
      ".portfolio-page .portfolio-pending",
      ".booking-detail-page .booking-panel > h1",
      ".booking-detail-page .booking-panel > .intro",
      ".booking-detail-page .step-heading",
      ".academy-page .academy-intro",
      ".academy-page .academy-course-options",
      ".academy-page .academy-curriculum",
      ...(window.matchMedia("(max-width: 540px)").matches ? [
        ".usha-home .booking-faq-kicker",
        ".usha-home .booking-faq h2",
        ".usha-home .booking-faq-list",
      ] : []),
    ].join(",")));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.remove("is-pending");
        target.classList.add("is-revealed");
        observer.unobserve(target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

    elements.forEach((element, index) => {
      element.classList.add("site-reveal");
      element.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
      if (element.getBoundingClientRect().top >= window.innerHeight) element.classList.add("is-pending");
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      elements.forEach((element) => {
        element.classList.remove("site-reveal", "is-pending", "is-revealed");
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, [pathname]);

  return null;
}
