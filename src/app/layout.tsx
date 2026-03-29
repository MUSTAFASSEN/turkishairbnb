import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TürkEvim - Türkiye'nin En Güvenilir Konaklama Platformu",
  description:
    "TürkEvim ile Türkiye'nin dört bir yanında güvenli, uygun fiyatlı ve kaliteli konaklama seçeneklerini keşfedin. Sadece %5 komisyon ile ev sahipleri için en avantajlı platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col bg-white text-hof antialiased`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
