"use client";

import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Menu, X } from "lucide-react";
import SiteFooter from "@/components/site-footer";
import PageFaq from "@/components/page-faq";
import { homeFaq } from "@/lib/faq";
import { portfolioCategories } from "@/lib/portfolio";

const categoryLabels = ["Bridal", "Reception", "Engagement", "Mehendi", "Wedding shoot", "Special occasion"];
const featuredMakeovers = portfolioCategories.filter((category) => !category.preview);
const testimonials = [
  { name: "Anisha Shrestha", occasion: "Bridal makeup", quote: "I felt comfortable sharing the look I wanted. The finished makeup felt like me, just a little more polished." },
  { name: "Prakriti Rai", occasion: "Reception makeup", quote: "The getting-ready experience felt calm and thoughtful. I loved how the makeup worked with my outfit." },
  { name: "Srijana Gurung", occasion: "Engagement makeup", quote: "My look felt fresh in photos, and I felt confident throughout the celebration." },
  { name: "Samiksha Thapa", occasion: "Mehendi makeup", quote: "I brought a few ideas with me, and the final look came together beautifully." },
  { name: "Nisha Karki", occasion: "Special occasion makeup", quote: "I wanted something soft for my day. The result felt effortless and still felt like me." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isPhone, setIsPhone] = useState(false);
  const makeoverTrack = useRef<HTMLDivElement>(null);
  const testimonialTrack = useRef<HTMLDivElement>(null);
  const [testimonialViewport, testimonialApi] = useEmblaCarousel({ align: "center", loop: true, breakpoints: { "(min-width: 541px)": { active: false } } });

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 540px)");
    const updatePhone = () => setIsPhone(phone.matches);
    updatePhone();
    phone.addEventListener("change", updatePhone);
    return () => phone.removeEventListener("change", updatePhone);
  }, []);

  useEffect(() => {
    if (!testimonialApi) return;
    const updateIndex = () => setTestimonialIndex(testimonialApi.selectedScrollSnap());
    testimonialApi.on("select", updateIndex);
    updateIndex();
    return () => { testimonialApi.off("select", updateIndex); };
  }, [testimonialApi]);

  useEffect(() => {
    const updateScroll = () => setScrolled((current) => current ? window.scrollY > 40 : window.scrollY > 100);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    if (!compactMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setCompactMenuOpen(false); }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [compactMenuOpen]);

  useEffect(() => { setCompactMenuOpen(false); }, [scrolled]);

  const selected = portfolioCategories[selectedCategory];
  const featured = Array.from({ length: 3 }, (_, offset) => featuredMakeovers[(featuredIndex + offset) % featuredMakeovers.length]);

  function selectMakeover(index: number) {
    const track = makeoverTrack.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    setSelectedCategory(index);
    track.scrollTo({ left: card.offsetLeft - (track.children[0] as HTMLElement).offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function updateSelectedMakeover() {
    const track = makeoverTrack.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const origin = cards[0].offsetLeft;
    const nearest = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - origin - track.scrollLeft) < Math.abs(cards[best].offsetLeft - origin - track.scrollLeft) ? index : best, 0);
    setSelectedCategory(nearest);
  }

  function changeFeatured(direction: number) {
    setFeaturedIndex((index) => (index + direction + featuredMakeovers.length) % featuredMakeovers.length);
  }

  function selectTestimonial(index: number) {
    if (isPhone && testimonialApi) {
      testimonialApi.scrollTo((index + testimonials.length) % testimonials.length);
      return;
    }
    const track = testimonialTrack.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    setTestimonialIndex(index);
    track.scrollTo({ left: card.offsetLeft - (track.children[0] as HTMLElement).offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function updateSelectedTestimonial() {
    if (isPhone) return;
    const track = testimonialTrack.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const origin = cards[0].offsetLeft;
    const nearest = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - origin - track.scrollLeft) < Math.abs(cards[best].offsetLeft - origin - track.scrollLeft) ? index : best, 0);
    setTestimonialIndex(nearest);
  }

  function renderHeader() {
    return (
      <header className={`usha-compact-header${scrolled ? " is-pinned" : ""}`}>
        <nav className="usha-compact-nav" aria-label="Studio navigation">
          <a href="#home">Home</a>
          <a href="#works">Our works</a>
          <a href="#about">About us</a>
          <a href="/academy">Academy</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="usha-compact-actions">
          <button className="usha-icon-button usha-compact-menu" type="button" aria-label={compactMenuOpen ? "Close studio navigation" : "Open studio navigation"} aria-expanded={compactMenuOpen} aria-controls="usha-compact-menu" onClick={() => setCompactMenuOpen(!compactMenuOpen)}>{compactMenuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {compactMenuOpen && <nav className="usha-dropdown" id="usha-compact-menu" aria-label="Expanded studio navigation">
          <a href="#home" onClick={() => setCompactMenuOpen(false)}>Home</a>
          <a href="#works" onClick={() => setCompactMenuOpen(false)}>Our works</a>
          <a href="#about" onClick={() => setCompactMenuOpen(false)}>About us</a>
          <a href="/academy" onClick={() => setCompactMenuOpen(false)}>Academy</a>
          <a href="#contact" onClick={() => setCompactMenuOpen(false)}>Contact</a>
        </nav>}
      </header>

    );
  }

  return (
    <main className="booking-page usha-home">
      <a className={`usha-default-logo${scrolled ? " is-hidden" : ""}`} href="#home" aria-label="Usha Makeup and Nails home" aria-hidden={scrolled && !isPhone} tabIndex={scrolled && !isPhone ? -1 : undefined}><img src="/usha-logo-white.png" alt="Usha Makeup and Nails" /></a>
      {renderHeader()}

      <section className="usha-hero" id="home" aria-labelledby="usha-hero-title">
        <img className="usha-hero-background" src="/usha-landing-hd.png" alt="Makeup look by Usha Makeup and Nails" fetchPriority="high" />
        <div className="usha-hero-copy">
          <h1 id="usha-hero-title"><span className="usha-hero-intro"><span className="usha-hero-line">Your <strong>look.</strong></span><span className="usha-hero-line">Your <strong>moment.</strong></span></span><span className="usha-hero-line usha-hero-made">Made <span className="usha-hero-script">Beautiful</span></span></h1>
          <p>From bridal beginnings to life’s little celebrations. Makeup that feels like you, by Usha.</p>
        </div>
        <div className="usha-hero-bottom">
          <div className="usha-hero-booking">
            <a className="usha-book-now" href="/book">Book now <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="usha-featured">
            <div className="usha-featured-cards" key={featuredIndex} aria-label="Featured makeover galleries" aria-live="polite">
              {featured.map((category) => <a className="usha-featured-card" key={category.slug} href={`/works/${category.slug}`}>
                <img src={category.cover} alt="" />
                <span className="usha-card-arrow"><ArrowUpRight size={15} aria-hidden="true" /></span>
                <span className="usha-featured-card-name">{categoryLabels[portfolioCategories.indexOf(category)]}<small>Makeup by Usha</small></span>
              </a>)}
            </div>
            <div className="usha-carousel-controls">
              <span className="usha-carousel-number">{String(featuredIndex + 1).padStart(2, "0")}</span>
              <span className="usha-carousel-progress" aria-hidden="true"><span style={{ width: `${((featuredIndex + 1) / featuredMakeovers.length) * 100}%` }} /></span>
              <span className="usha-carousel-total">{String(featuredMakeovers.length).padStart(2, "0")}</span>
              <button type="button" onClick={() => changeFeatured(-1)} aria-label="Previous featured makeovers"><ArrowLeft size={16} /></button>
              <button className="is-next" type="button" onClick={() => changeFeatured(1)} aria-label="Next featured makeovers"><ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
        <a className="usha-scroll-link" href="#works" aria-label="Scroll to our makeovers"><ArrowDown size={16} /></a>
      </section>

      <section className="usha-offer" aria-label="Dashain offer">
        <img src="/dashain-offer.webp" width="4000" height="1177" alt="Dashain offer: 3-Day Self-Makeup Class, Only Rs. 3,000. Day 1: Basic skin care / skin type, base makeup (everyday makeup), products / brushes information. Day 2: Soft glam party look. Day 3: Party makeup (Bold)." loading="lazy" />
      </section>

      <section className="usha-makeovers" id="works" aria-labelledby="works-title">
        <div className="usha-section-heading">
          <h2 id="works-title">Makeovers <strong>we create.</strong></h2>
          <a className="usha-outline-link" href={`/works/${selected.slug}`}>Explore gallery <ArrowUpRight size={15} /></a>
        </div>
        <div className="usha-makeover-layout">
          <div className="usha-makeover-list" aria-label="Choose a makeover to preview">
            {portfolioCategories.map((category, index) => <button className={index === selectedCategory ? "is-selected" : ""} key={category.slug} type="button" aria-pressed={index === selectedCategory} onClick={() => selectMakeover(index)}>
              <img src={category.cover} alt="" loading="lazy" />
              <span>{category.title}</span>
              <span className="usha-list-arrow"><ArrowUpRight size={14} aria-hidden="true" /></span>
            </button>)}
          </div>
          <div className="usha-makeover-carousel">
            <div className="usha-makeover-photos" ref={makeoverTrack} role="region" aria-label="Makeover galleries, scroll horizontally" tabIndex={0} onScroll={updateSelectedMakeover} onKeyDown={(event) => {
              if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
              event.preventDefault();
              selectMakeover(Math.max(0, Math.min(portfolioCategories.length - 1, selectedCategory + (event.key === "ArrowRight" ? 1 : -1))));
            }}>
              {portfolioCategories.map((category) => <a className="usha-makeover-photo" href={`/works/${category.slug}`} key={category.slug}>
                <img src={category.cover} alt={`${category.title} by Usha Makeup and Nails`} loading="lazy" />
                <span className="usha-photo-detail"><ArrowUpRight size={19} aria-hidden="true" /><span>View more</span></span>
                <span className="usha-photo-caption">{category.title}{category.preview && <small>Photo coming soon</small>}</span>
              </a>)}
            </div>
            <div className="usha-makeover-scroll-controls">
              <span>Swipe to explore</span>
              <button type="button" aria-label="Previous makeover" disabled={selectedCategory === 0} onClick={() => selectMakeover(selectedCategory - 1)}><ArrowLeft size={17} /></button>
              <button type="button" aria-label="Next makeover" disabled={selectedCategory === portfolioCategories.length - 1} onClick={() => selectMakeover(selectedCategory + 1)}><ArrowRight size={17} /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="about-content"><h2 id="about-title">A moment made<br />for <em>you.</em></h2><p>Usha Makeup and Nails is a makeup and nail studio in New Baneshwor, Kathmandu. Choose a service, find an open time, and make your appointment online.</p></div>
      </section>

      <section className="usha-testimonials" aria-labelledby="testimonials-title">
        <div className="usha-testimonials-heading">
          <div><p className="usha-testimonials-kicker">Sample testimonials</p><h2 id="testimonials-title">What Our <strong>Clients Say</strong></h2></div>
          <span className="usha-testimonials-count">{String(testimonialIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</span>
        </div>
        <div className="usha-testimonials-viewport" ref={testimonialViewport}>
        <div className="usha-testimonials-track" ref={testimonialTrack} role="region" aria-label="Example testimonials, scroll horizontally" tabIndex={0} onScroll={updateSelectedTestimonial} onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          selectTestimonial(isPhone ? (testimonialIndex + (event.key === "ArrowRight" ? 1 : -1) + testimonials.length) % testimonials.length : Math.max(0, Math.min(testimonials.length - 1, testimonialIndex + (event.key === "ArrowRight" ? 1 : -1))));
        }}>
          {testimonials.map((testimonial, index) => <article className={`usha-testimonial-card${index === testimonialIndex ? " is-active" : ""}`} key={testimonial.name}>
            <div className="usha-testimonial-surface">
              <span className="usha-testimonial-number">{String(index + 1).padStart(2, "0")}</span>
              <blockquote>“{testimonial.quote}”</blockquote>
              <div className="usha-testimonial-person"><span aria-hidden="true">{testimonial.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{testimonial.name}</strong><small>{testimonial.occasion}</small></div></div>
            </div>
          </article>)}
        </div>
        </div>
        <div className="usha-testimonials-controls"><span>Swipe to read more</span><button type="button" aria-label="Previous testimonial" disabled={!isPhone && testimonialIndex === 0} onClick={() => selectTestimonial(testimonialIndex - 1)}><ArrowLeft size={17} /></button><button type="button" aria-label="Next testimonial" disabled={!isPhone && testimonialIndex === testimonials.length - 1} onClick={() => selectTestimonial(testimonialIndex + 1)}><ArrowRight size={17} /></button></div>
        <p className="usha-testimonials-note">Example reviews shown for layout preview.</p>
      </section>

      <PageFaq id="home-questions" title="Makeup Questions" mobileTitle="Frequently Asked Questions" items={homeFaq} />
      <SiteFooter />
    </main>
  );
}
