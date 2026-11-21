import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Providers } from "@/components/providers";
import "./globals.css";

// Conditional import keeps the dev nav out of production bundles entirely.
const DevNav =
  process.env.NODE_ENV === "development"
    ? dynamic(() =>
        import("@/components/dev/dev-nav").then((mod) => mod.DevNav),
      )
    : null;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sillage",
  description: "A perfume collection website",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          {DevNav && <DevNav />}
        </Providers>
      </body>
    </html>
  );
}
