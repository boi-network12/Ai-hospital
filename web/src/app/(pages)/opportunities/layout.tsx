// app/(pages)/opportunities/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Opportunities at Neuromed – Join Healthcare Innovation",
  description: "Explore career opportunities at Neuromed. Join our team of doctors, nurses, and technologists building AI-powered hospital intelligence systems. Make an impact in healthcare.",
  keywords: [
    "healthcare careers",
    "hospital technology jobs",
    "medical AI opportunities",
    "doctor positions",
    "nursing jobs",
    "health tech careers",
    "Neuromed opportunities",
    "clinical technology roles",
    "AI healthcare jobs",
    "medical innovation careers"
  ],
  authors: [{ name: "Neuromed Talent Team" }],
  openGraph: {
    title: "Career Opportunities at Neuromed – Join Healthcare Innovation",
    description: "Join Neuromed's mission to transform healthcare with AI. Explore opportunities for medical professionals and technologists.",
    url: "https://neuromed.sbs/opportunities",
    siteName: "Neuromed Opportunities",
    images: [
      {
        url: "https://neuromed.sbs/opportunities-og.png",
        width: 1200,
        height: 630,
        alt: "Neuromed Career Opportunities – Join Our Team",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Opportunities at Neuromed – Join Healthcare Innovation",
    description: "Build the future of hospital intelligence with Neuromed. Explore exciting career paths in AI healthcare.",
    images: ["https://neuromed.sbs/opportunities-og.png"],
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
    canonical: "https://neuromed.sbs/opportunities",
  },
};

export default function OpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}