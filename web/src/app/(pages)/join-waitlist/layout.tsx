// app/(pages)/waitlist/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Neuromed Waitlist – Early Access to AI-Powered Healthcare",
  description: "Be among the first to experience Neuromed's revolutionary AI healthcare platform. Join our waitlist for exclusive early access to personalized medical insights.",
  keywords: [
    "healthtech waitlist",
    "AI healthcare early access",
    "medical app waitlist",
    "health innovation beta",
    "Neuromed waitlist",
    "healthcare technology beta",
    "AI medical insights early access",
    "digital health waitlist",
    "health analytics platform",
    "medical AI waitlist"
  ],
  authors: [{ name: "Neuromed Team" }],
  openGraph: {
    title: "Join Neuromed Waitlist – Early Access to AI-Powered Healthcare",
    description: "Get exclusive early access to Neuromed's AI healthcare platform. Join thousands already on the waitlist.",
    url: "https://neuromed.sbs/waitlist",
    siteName: "Neuromed Waitlist",
    images: [
      {
        url: "https://neuromed.sbs/waitlist-og.png",
        width: 1200,
        height: 630,
        alt: "Neuromed Waitlist – Join Early Access",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join Neuromed Waitlist – Early Access to AI-Powered Healthcare",
    description: "Get early access to revolutionary AI healthcare. Join the Neuromed waitlist today.",
    images: ["https://neuromed.sbs/waitlist-og.png"],
    creator: "@Neuro-medAi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://neuromed.sbs/waitlist",
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}