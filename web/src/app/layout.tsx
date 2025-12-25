import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono, PT_Sans_Narrow  } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ptSansNarrow = PT_Sans_Narrow({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans-narrow",
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
    url: "https://neuromed.sbs",
    siteName: "Neuromed",
    images: [
      {
        url: "https://neuromed.sbs/og-image.png",
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
    images: ["https://neuromed.sbs/og-image.png"],
    creator: "@Neuro-medAi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ptSansNarrow.variable} antialiased h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
             {children}
          </Providers>
        </ThemeProvider>
        <Analytics />
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Neuromed",
            operatingSystem: "Web",
            applicationCategory: "MedicalApplication",
            description:
              "AI-powered medical insights app. Join the waitlist to get personalized health analytics.",
            url: "https://neuromed.sbs",
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
