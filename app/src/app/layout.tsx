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
  title: "Leash — AI Agent Spend Governance",
  description: "Put your AI agents on a leash. Policy-gated wallets powered by Open Wallet Standard.",
  keywords: ["AI agents", "spend governance", "OWS", "Open Wallet Standard", "policy engine", "multi-chain"],
  authors: [{ name: "Socialure" }],
  openGraph: {
    title: "Leash — AI Agent Spend Governance",
    description: "Policy-gated wallet management for autonomous AI agents. Set spend limits, chain allowlists, and monitor activity in real-time.",
    type: "website",
    url: "https://leash-zi0u.onrender.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leash — AI Agent Spend Governance",
    description: "Put your AI agents on a leash. Policy-gated wallets powered by Open Wallet Standard.",
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
