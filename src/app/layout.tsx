import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CablePro — Cable TV Management System",
  description: "Comprehensive management system for cable TV operators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
