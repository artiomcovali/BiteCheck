import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--bc-font-body",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--bc-font-display",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--bc-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BiteCheck — Cal Poly dining, audited.",
  description:
    "Real-time, source-cited dining recommendations for students with allergies, religious restrictions, and dietary needs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body className="bg-bc-bg text-bc-text">{children}</body>
    </html>
  );
}
