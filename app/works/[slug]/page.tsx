import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPortfolioCategory, portfolioCategories } from "@/lib/portfolio";
import PageFaq from "@/components/page-faq";
import SiteFooter from "@/components/site-footer";
import { portfolioFaq } from "@/lib/faq";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return portfolioCategories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findPortfolioCategory((await params).slug);
  return { title: category ? `${category.title} | Usha Makeup and Nails` : "Our Works | Usha Makeup and Nails" };
}

export default async function PortfolioCategoryPage({ params }: Props) {
  const category = findPortfolioCategory((await params).slug);
  if (!category) notFound();
  const isBridal = category.slug === "bridal-makeup";
  const hasPhotos = isBridal || category.slug === "mehendi-makeup";
  const bridalPhotos = ["/portfolio/bridal.png", ...Array.from({ length: 12 }, (_, index) => `/portfolio/bridal-gallery/bridal-${String(index + 1).padStart(2, "0")}.jpg`)];
  const photos = isBridal ? bridalPhotos : [category.cover];

  return (
    <main className="portfolio-page">
      <header className="portfolio-header">
        <a href="/" aria-label="Usha Makeup and Nails home"><img src="/usha-logo-white.png" alt="Usha Makeup and Nails" /></a>
        <nav aria-label="Portfolio navigation"><a href="/">Home</a><a href="/#works">Our works</a><a href="/#about">About</a><a href="/academy">Academy</a><a href="#contact">Contact</a></nav>
      </header>
      {hasPhotos && <section className="portfolio-heading portfolio-heading-simple"><h1>{category.title}</h1></section>}
      {!hasPhotos && <section className="portfolio-heading">
        <a className="portfolio-back" href="/#works">← All makeup categories</a>
        <p className="portfolio-kicker">Makeup portfolio</p>
        <h1>{category.title}</h1>
        <p className="portfolio-description">This gallery is being prepared. More photographs will be added here soon.</p>
      </section>}
      {hasPhotos ? (
        <section className={`portfolio-gallery portfolio-gallery-direct${isBridal ? "" : " portfolio-gallery-single"}`} aria-label={`${category.title} gallery`}>
          {photos.map((photo, index) => (
            <figure className="portfolio-gallery-item" key={photo}>
              <img src={photo} alt={`${category.title} by Usha Makeup and Nails, look ${index + 1}`} loading={index < 4 ? "eager" : "lazy"} />
            </figure>
          ))}
        </section>
      ) : (
        <section className="portfolio-pending" aria-label={`${category.title} gallery preview`}>
          <img src={category.cover} alt="" />
          <p>Gallery photographs coming soon.</p>
        </section>
      )}
      <PageFaq id={`${category.slug}-questions`} title={`${category.title} Questions`} items={portfolioFaq[category.slug]} />
      <SiteFooter />
    </main>
  );
}
