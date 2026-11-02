import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";
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
  title: { default: "Task Manager", template: "%s | Task Manager" },
  description: "Simple task manager built with Next.js and tRPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables go on <html>, not <body>: the base styles apply
    // `font-sans` to <html>, and a CSS variable only exists below the element
    // that defines it.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
            <Link href="/" className="font-semibold">
              Task Manager
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </main>
        {/* The app only ships a light theme, so toasts must not follow the OS dark mode. */}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
