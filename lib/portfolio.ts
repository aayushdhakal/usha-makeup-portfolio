export const portfolioCategories = [
  { slug: "bridal-makeup", title: "Bridal Makeup", cover: "/portfolio/bridal.png", preview: false },
  { slug: "pre-post-reception-makeup", title: "Pre/Post Reception Makeup", cover: "/portfolio/reception.png", preview: false },
  { slug: "engagement-makeup", title: "Engagement Makeup", cover: "/portfolio/engagement.png", preview: false },
  { slug: "mehendi-makeup", title: "Mehendi Makeup", cover: "/portfolio/mehendi.jpg", preview: false },
  { slug: "post-pre-wedding-shoot-makeup", title: "Post/Pre Wedding Shoot Makeup", cover: "/portfolio/wedding-shoot.png", preview: false },
  { slug: "birthday-anniversary-special-occasion-makeup", title: "Birthday/Anniversary/Any Special Occasion Makeup", cover: "/portfolio/anniversary.png", preview: false },
] as const;

export type PortfolioCategory = (typeof portfolioCategories)[number];

export function findPortfolioCategory(slug: string) {
  return portfolioCategories.find((category) => category.slug === slug);
}
