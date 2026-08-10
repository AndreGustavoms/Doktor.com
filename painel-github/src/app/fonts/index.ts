import { Archivo, Public_Sans, JetBrains_Mono } from "next/font/google";

/*
 * next/font faz self-hosting em build time — os arquivos são servidos por
 * /_next/static/media/, nunca por fonts.googleapis.com em runtime. Isso é
 * exigido pelo CSP font-src 'self' (ver next.config.ts) e evita que o
 * carregamento da fonte vaze para o Google que o painel está em uso.
 */

export const archivoExpanded = Archivo({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-archivo-expanded",
  display: "swap",
});

export const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-public-sans",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
