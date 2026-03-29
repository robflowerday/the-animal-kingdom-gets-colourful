import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What colour is this word?",
  description: "Type any word and see its colour",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
