import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import { AuthReturn } from "@/components/AuthReturn";
import { Nav } from "@/components/Nav";
import { AskTra } from "@/components/AskTra";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://totalrewardsaccelerator.com"
  ),
  title: "Total Rewards Accelerator",
  description:
    "Making compensation easy for all. Stop crunching rows — start designing strategy. Comp engineering toolkit by Mikéz.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
  openGraph: {
    title: "Total Rewards Accelerator",
    description: "Making compensation easy for all. Comp engineering toolkit by Mikéz.",
    images: [{ url: "/brand/tra-logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthReturn />
        <Nav />
        <main>{children}</main>
        <SiteFooter />
        <AskTra />
        <Analytics />
      </body>
    </html>
  );
}
