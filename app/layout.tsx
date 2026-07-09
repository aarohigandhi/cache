import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cache-cacheshots.vercel.app"),
  title: "Cache — Stop scrolling. Start searching.",
  description:
    "Cache is an AI-powered screenshot manager that turns your camera roll into a searchable library. Upload screenshots and find them later with natural language search.",
  openGraph: {
    title: "Cache — Stop scrolling. Start searching.",
    description:
      "Cache is an AI-powered screenshot manager that turns your camera roll into a searchable library.",
    images: ["/cache-demo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
