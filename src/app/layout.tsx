import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renivet | Sustainable Fashion",
  description: "Renivet marketplace — Phase 0 technical foundation"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
