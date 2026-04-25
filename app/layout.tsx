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
    default: "AgroBridge — Mais Crédito Aprovado, Menos Burocracia",
    template: "%s · AgroBridge",
  },
  description:
    "Documento certo, no lugar certo, com a defesa técnica certa. Assessoria completa pra produtor que quer parar de perder tempo e começar a aprovar mais financiamento.",
  applicationName: "AgroBridge",
  authors: [{ name: "AgroBridge" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "AgroBridge",
    title: "AgroBridge — Mais Crédito Aprovado, Menos Burocracia",
    description:
      "Documento certo, no lugar certo, com a defesa técnica certa. Assessoria completa pra produtor que quer parar de perder tempo e começar a aprovar mais financiamento.",
    // images: injetadas automaticamente do app/opengraph-image.png
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroBridge — Mais Crédito Aprovado, Menos Burocracia",
    description:
      "Documento certo, no lugar certo, com a defesa técnica certa. Assessoria completa pra produtor que quer parar de perder tempo e começar a aprovar mais financiamento.",
    // images: injetadas automaticamente do app/twitter-image.png
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
