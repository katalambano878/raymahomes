import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from '@/lib/context/CartContext';
import { WishlistProvider } from '@/lib/context/WishlistContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Premium Kitchenware - Quality Cookware & Kitchen Essentials",
  description: "Discover premium kitchenware designed for home chefs. Shop pots, pans, knives, and kitchen accessories with lifetime warranties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>
          <WishlistProvider>
            <Header />
            {children}
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
