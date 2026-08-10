import type { Metadata } from "next";
import { archivoExpanded, publicSans, jetbrainsMono } from "./fonts";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel GitHub",
  description: "Painel local de gestão dos meus repositórios GitHub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivoExpanded.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
