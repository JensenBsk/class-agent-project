import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CareerLaunch Agent", template: "%s · CareerLaunch Agent" },
  description:
    "An internship assistant that finds, explains and tracks opportunities, and asks before doing anything important.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="app-header">
          <div className="container app-header__inner">
            <Link href="/" className="brand">
              CareerLaunch
            </Link>
            <AppNav />
          </div>
        </header>
        <main id="main" className="container">
          {children}
        </main>
        <footer className="app-footer container">
          <p>
            CareerLaunch never submits applications or sends messages for you. You approve every
            important step.
          </p>
        </footer>
      </body>
    </html>
  );
}
