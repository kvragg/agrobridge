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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agrobridge.app";

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
    // TODO(Paulo): exportar public/og-image.png (1200×630) do Figma e ligar aqui.
    // images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AgroBridge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroBridge — Crédito rural aprovado",
    description:
      "Entrevista com IA, checklist personalizado e dossiê técnico pronto pra banco.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    // TODO(Paulo): apple-icon.png 180×180 quando disponível.
  },
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
