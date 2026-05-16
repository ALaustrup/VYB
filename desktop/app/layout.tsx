import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { DesktopTitleBar } from "@/components/desktop/title-bar";
import { IconDock } from "@/components/navigation/icon-dock";
import { env } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vyb Desktop",
  description: "Cross-platform premium social desktop experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  void env;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ClerkProvider>
          <AppProviders>
            <div className="desktop-shell">
              <DesktopTitleBar />
              <main className="flex-1 overflow-y-auto pb-24">{children}</main>
              <IconDock />
            </div>
          </AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
