'use client';

import { DotBackgroundDemo } from '@/UI/DotBackgroundDemo';
import HomeNav from '@/components/Header/HomeNav';
import Footer from '@/components/HomeComponents/Footer';

import { AnimatedSection } from '@/components/Opportunities/AnimatedSection';
import { RoleCard } from '@/components/Opportunities/RoleCard';
import { TechSection } from '@/components/Opportunities/TechSection';
import { NurseSection } from '@/components/Opportunities/NurseSection';
import { DoctorSection } from '@/components/Opportunities/DoctorSection';
import Script from "next/script"

import {
  Code2,
  Stethoscope,
  Brain,
  ArrowRight,
} from 'lucide-react';
import FinalCTA from '@/components/HomeComponents/FinalCTA';


// Structured data for career opportunities page
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Career Opportunities at Neuromed",
  "description": "Explore healthcare technology career opportunities at Neuromed",
  "url": "https://neuromed.sbs/opportunities",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "JobPosting",
          "title": "Tech & Engineering Roles",
          "description": "Build scalable AI systems that power modern hospitals",
          "employmentType": ["FULL_TIME", "REMOTE", "CONTRACT"],
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Neuromed",
            "sameAs": "https://neuromed.sbs"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "JobPosting",
          "title": "Nursing Excellence Roles",
          "description": "Shape patient care workflows with real clinical insight",
          "employmentType": ["FULL_TIME", "PART_TIME"],
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Neuromed",
            "sameAs": "https://neuromed.sbs"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "JobPosting",
          "title": "Medical Leadership Roles",
          "description": "Design intelligent protocols that save lives",
          "employmentType": ["FULL_TIME"],
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Neuromed",
            "sameAs": "https://neuromed.sbs"
          }
        }
      }
    ]
  }
};

export default function Opportunities() {
  return (
    <DotBackgroundDemo>
      <HomeNav />
;
      <main className="w-full min-h-screen pt-20">
        {/* Hero */}
        <section className="px-6 md:px-10 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <AnimatedSection>
              <span className="inline-block px-4 py-2 rounded-full bg-[#8089ff]/10 text-[#8089ff] font-semibold text-sm mb-6">
                Join Our Mission to Transform Healthcare
              </span>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Build the Future of Hospital Intelligence
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
                We&apos;re looking for exceptional doctors, nurses, and technologists to help us
                revolutionize hospital operations with AI-powered systems.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Role selection */}
        <section className="px-6 md:px-10 pb-20">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                Choose Your Path
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8">
              <RoleCard
                icon={<Code2 size={32} />}
                title="Tech & Engineering"
                subtitle="Build scalable AI systems that power modern hospitals"
                gradient="from-[#8089ff] to-[#5a6aff]"
                href="#tech-requirements"
                badge="10+ Open Roles"
              />
              <RoleCard
                icon={<Stethoscope size={32} />}
                title="Nursing Excellence"
                subtitle="Shape patient care workflows with real clinical insight"
                gradient="from-emerald-500 to-teal-600"
                href="#nurse-requirements"
                badge="Urgent Need"
              />
              <RoleCard
                icon={<Brain size={32} />}
                title="Medical Leadership"
                subtitle="Design intelligent protocols that save lives"
                gradient="from-rose-500 to-pink-600"
                href="#doctor-requirements"
                badge="Senior Roles"
              />
            </div>
          </div>
        </section>

        {/* Detailed sections */}
        <TechSection />
        <NurseSection />
        <DoctorSection />

        {/* Final CTA */}
        <FinalCTA />
        <Script id="opportunities-structured-data" type="application/ld+json">
          {JSON.stringify(structuredData)}
        </Script>
      </main>

      <Footer />
    </DotBackgroundDemo>
  );
}