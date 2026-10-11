import type { Metadata } from "next";
import "./globals.css";
import SiteMotion from "@/components/site-motion";

export const metadata: Metadata = {
  title: "Usha Makeup and Nails | Makeup & Nail Studio",
  description: "Book a makeup or nail appointment at Usha Makeup and Nails in New Baneshwor, Kathmandu.",
  icons: {
    icon: "/usha-logo-dark.png",
    shortcut: "/usha-logo-dark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/4.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/4.0.0/uicons-brands/css/uicons-brands.css" />
      </head>
      <body className="antialiased">{children}<SiteMotion /></body>
    </html>
  );
}
