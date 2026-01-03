import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import colors from "./colors";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seven Questions a Day from the Art Institute of Chicago",
  description:
    "Built this simple quiz app to test your knowledge about famous artworks from the Art Institute of Chicago.",
  manifest: "/manifest.json",
  themeColor: colors.primary,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
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
        style={{ backgroundColor: colors.bg.page }}
      >
        {children}
      </body>
    </html>
  );
}
