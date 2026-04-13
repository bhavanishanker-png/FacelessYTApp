import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Velora AI — Generate YouTube Videos from Idea to Final Render",
  description:
    "Velora AI automates the complete YouTube video creation workflow. Generate ideas, scripts, AI voiceovers, scenes, and render your final video — all in minutes.",
  keywords: ["AI YouTube", "faceless YouTube", "AI video creation", "YouTube automation", "Velora AI"],
  openGraph: {
    title: "Velora AI — AI YouTube Studio",
    description: "From idea to final render — powered by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full w-full bg-[#030303] text-[#e5e2e1] antialiased selection:bg-[#c0c1ff]/20">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
