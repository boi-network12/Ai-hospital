import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
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
  title: "Neuromed – AI Medical Insights",
  description:
    "Join the waitlist for Neuromed, the AI-driven medical app that provides personalized insights and next-gen health analytics.",
  keywords: [
    "AI medical app",
    "personalized health insights",
    "Neuromed",
    "AI health analytics",
    "medical technology",
  ],
  authors: [{ name: "Kamdi", url: "https://kamdidev.vercel.app" }],
  openGraph: {
    title: "Neuromed – AI Medical Insights",
    description:
      "Join the waitlist for Neuromed, the AI-driven medical app that provides personalized insights and next-gen health analytics.",
    url: "https://neuromed-ai-ten.vercel.app",
    siteName: "Neuromed",
    images: [
      {
        url: "https://neuromed-ai-ten.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neuromed – AI Medical Insights",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neuromed – AI Medical Insights",
    description:
      "Join the waitlist for Neuromed, the AI-driven medical app that provides personalized insights and next-gen health analytics.",
    images: ["https://neuromed-ai-ten.vercel.app/og-image.png"],
    creator: "@Neuro-medAi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class">{children}</ThemeProvider>

        {/* Structured Data for SEO */}
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Neuromed",
            operatingSystem: "Web",
            applicationCategory: "MedicalApplication",
            description:
              "AI-powered medical insights app. Join the waitlist to get personalized health analytics.",
            url: "https://neuromed-ai-ten.vercel.app",
            author: {
              "@type": "Person",
              name: "Kamdi",
            },
          })}
        </Script>
      </body>
    </html>
  );
}
