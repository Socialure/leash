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
  title: "Leash — UI Dashboard for OpenWallet Standard",
  description: "Leash is the visual dashboard for OpenWallet Standard. Register agents, set per-agent budgets, restrict chains and vendors — all local, all yours. Keys never leave ~/.ows/.",
  keywords: ["OpenWallet Standard", "OWS", "AI agents", "agent wallet", "spend governance", "local-first wallet", "policy engine", "multi-chain", "agent spend"],
  authors: [{ name: "Socialure" }],
  openGraph: {
    title: "Leash — UI Dashboard for OpenWallet Standard",
    description: "The visual dashboard for OWS. Register agents, set budgets, restrict chains. Local-first. No cloud. Keys never leave your machine.",
    type: "website",
    url: "https://leash-zi0u.onrender.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leash — UI Dashboard for OpenWallet Standard",
    description: "The visual dashboard for OpenWallet Standard. Local-first. No cloud. Keys never leave ~/.ows/.",
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
