// app/(pages)/careers/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers at Neuromed – Join Our Healthcare Revolution",
  description: "Build the future of AI-powered healthcare with Neuromed. Explore career opportunities for doctors, nurses, and technologists. Apply now to make a real impact.",
  keywords: [
    "healthcare careers",
    "medical jobs",
    "AI medical careers",
    "doctor opportunities",
    "nurse positions",
    "health tech jobs",
    "Neuromed careers",
    "medical AI jobs",
    "clinical technology careers",
    "remote healthcare jobs"
  ],
  authors: [{ name: "Neuromed Careers Team" }],
  openGraph: {
    title: "Careers at Neuromed – Join Our Healthcare Revolution",
    description: "Build the future of AI-powered healthcare. Explore opportunities for medical professionals and technologists at Neuromed.",
    url: "https://neuromed.sbs/careers",
    siteName: "Neuromed Careers",
    images: [
      {
        url: "https://neuromed.sbs/careers-og.png",
        width: 1200,
        height: 630,
        alt: "Neuromed Careers – Join Our Team",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers at Neuromed – Join Our Healthcare Revolution",
    description: "Explore exciting opportunities in AI healthcare. Build the future with Neuromed.",
    images: ["https://neuromed.sbs/careers-og.png"],
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
    canonical: "https://neuromed.sbs/careers",
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}