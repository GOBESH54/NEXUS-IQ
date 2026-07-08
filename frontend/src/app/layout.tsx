import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS IQ™ — Industrial Knowledge Intelligence",
  description: "The Industrial Brain — Connect Every Document. Answer Every Question. Prevent Every Failure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-nq-bg-primary text-nq-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
