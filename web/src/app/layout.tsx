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
  title: "Neuromed – Your AI Health Companion | AI-Powered Medical Assistant",
  description:
    "Neuromed is your personal AI health companion. Get intelligent symptom analysis, connect with verified doctors, and receive personalized health insights. Join the waitlist for AI-driven healthcare.",
  keywords: [
    "AI health assistant",
    "personal medical assistant",
    "symptom checker AI",
    "find doctors near me",
    "health monitoring app",
    "AI medical advice",
    "telemedicine app",
    "personalized healthcare",
    "Neuromed AI health",
    "virtual health assistant",
    "doctor booking app",
    "wearable health tracking",
    "AI wellness companion",
    "health data analysis",
    "medical appointment booking"
  ],
  authors: [{ name: "Kamdi", url: "https://kamdidev.vercel.app" }],
  creator: "Neuromed AI",
  publisher: "Neuromed Health Technologies",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "fTvTegIC7uHSFO-JKx9ljEUPXdwHfD70aBlUd4CbJfk", 
    // yandex: "YOUR_YANDEX_VERIFICATION_CODE",
  },
  openGraph: {
    title: "Neuromed – AI Health Companion | Personalized Medical Assistant",
    description:
      "Your personal AI health companion. Get symptom analysis, connect with doctors, and track your health with intelligent insights. Join the waitlist today.",
    url: "https://neuromed.sbs",
    siteName: "Neuromed AI Health Assistant",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://neuromed.sbs/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neuromed AI Health Assistant Interface - Personal Health Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neuromed – Your AI Health Companion",
    description: "AI-powered health assistant for personalized medical insights and doctor connections.",
    images: ["https://neuromed.sbs/og-image.png"],
    creator: "@Neuromed_AI",
    site: "@Neuromed_AI",
  },
  category: "health technology",
  metadataBase: new URL("https://neuromed.sbs"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Site Verification Meta Tag */}
        <meta name="google-site-verification" content="fTvTegIC7uHSFO-JKx9ljEUPXdwHfD70aBlUd4CbJfk" />
        <meta name="twitter:image" content="https://neuromed.sbs/og-image.png" />
        <meta name="twitter:image:alt" content="Neuromed AI Health Assistant" />
      </head>
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
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Neuromed AI Health Assistant",
              "operatingSystem": "Web, iOS, Android",
              "applicationCategory": "HealthApplication",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1200"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/PreOrder"
              },
              "description": "AI-powered personal health companion providing symptom analysis, doctor connections, and personalized health insights.",
              "url": "https://neuromed.sbs",
              "author": {
                "@type": "Organization",
                "name": "Neuromed Health Technologies",
                "url": "https://neuromed.sbs"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://neuromed.sbs",
              "name": "Neuromed AI Health Assistant",
              "description": "Your personal AI health companion for intelligent healthcare insights",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://neuromed.sbs/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Neuromed Health Technologies",
              "url": "https://neuromed.sbs",
              "logo": "https://neuromed.sbs/logo.png",
              "sameAs": [
                "https://twitter.com/Neuromed_AI",
                "https://linkedin.com/company/neuromed",
                "https://github.com/boi-network12/Ai-hospital"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-XXX-XXX-XXXX",
                "contactType": "customer service",
                "areaServed": "US",
                "availableLanguage": ["English"]
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is Neuromed's AI a replacement for doctors?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, Neuromed's AI assistant provides health information and preliminary insights but cannot replace professional medical advice. Always consult qualified healthcare providers for diagnosis and treatment."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does Neuromed protect my health data?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We use HIPAA-compliant encryption and give you complete control over your data. Your information is encrypted end-to-end and you decide what to share with healthcare providers."
                  }
                }
              ]
            }
          ])}
        </Script>
      </body>
    </html>
  );
}
