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
  title: "Leash — SpendOS for Teams",
  description: "Issue OWS API keys to your AI agents with per-agent budgets, chain restrictions, and vendor allowlists. Real-time spend governance dashboard.",
  keywords: ["AI agents", "spend governance", "OWS", "Open Wallet Standard", "policy engine", "multi-chain", "SpendOS", "agent wallet"],
  authors: [{ name: "Socialure" }],
  openGraph: {
    title: "Leash — SpendOS for Teams",
    description: "Issue OWS API keys to your AI agents. Set budgets, restrict chains and vendors, track spend in real-time.",
    type: "website",
    url: "https://leash-zi0u.onrender.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leash — SpendOS for Teams",
    description: "Issue OWS API keys to AI agents with per-agent budgets, chain restrictions, and vendor allowlists.",
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
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
