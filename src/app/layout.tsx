import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin", "thai"],
});

export const metadata: Metadata = {
  title: "SmilePet Clinic",
  description: "Clinic Management System",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anuphan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
