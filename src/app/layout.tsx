import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { Sidebar } from "@/components/ui/sidebar";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Sync - Organize Your World",
  description: "A modern schedule management application for your daily life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">
               {children}
            </main>
          </div>
          
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Life Sync. All rights reserved.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}