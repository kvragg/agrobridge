import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agrobridge.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AgroBridge — Crédito rural aprovado",
    template: "%s · AgroBridge",
  },
  description:
    "Consultoria especializada em crédito rural. Entrevista com IA, checklist personalizado e laudo técnico no padrão que o banco aprova.",
  applicationName: "AgroBridge",
  authors: [{ name: "AgroBridge" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "AgroBridge",
    title: "AgroBridge — Crédito rural aprovado",
    description:
      "Entrevista com IA, checklist personalizado e dossiê técnico pronto pra banco.",
    // images: injetadas automaticamente do app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroBridge — Crédito rural aprovado",
    description:
      "Entrevista com IA, checklist personalizado e dossiê técnico pronto pra banco.",
    // images: injetadas automaticamente do app/twitter-image.tsx
  },
  // icons: removido — Next 16 injeta automaticamente baseado em
  // app/icon.tsx (favicon 32×32) e app/apple-icon.tsx (180×180).
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
