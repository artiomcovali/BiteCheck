import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/bitecheck/app/AppShell";
import { UserContextProvider } from "@/context/UserContext";
import { loadHydratedProfile } from "@/lib/user-profile";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await loadHydratedProfile();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body suppressHydrationWarning className="bg-bc-bg text-bc-text">
        <UserContextProvider profile={profile}>
          <AppShell>{children}</AppShell>
        </UserContextProvider>
      </body>
    </html>
  );
}
