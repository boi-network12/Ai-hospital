"use client";


import { DotBackgroundDemo } from "@/UI/DotBackgroundDemo";
import HomeNav from "@/components/Header/HomeNav";
import HeroBg from "@/components/HomeComponents/HeroBg";
import Displays from "@/components/HomeComponents/Displays";
import Features from "@/components/HomeComponents/Features";
import HowItWorks from "@/components/HomeComponents/HowItWorks";
import Testimonials from "@/components/HomeComponents/Testimonials";
import Pricing from "@/components/HomeComponents/Pricing";
import Faq from "@/components/HomeComponents/Faq";
import FinalCTA from "@/components/HomeComponents/FinalCTA";
import Footer from "@/components/HomeComponents/Footer";
import { AlertTriangle } from "lucide-react";

export default function Home() {

  return (
    <DotBackgroundDemo>
        <main className="w-full min-h-screen">
          <HomeNav />

          {/* first section "/" */}
          <section id="/" className="mt-30 md:mt-50 w-full md:px-10">
            <HeroBg />
          </section>
          <section id="features" className="mt-10 md:mt-20 w-full md:px-10">
            <Features />
          </section>
          <section id="#" className="mt-10 md:mt-20 w-full md:px-10">
            <Displays />
          </section>
          <section id="#" className="mt-10 md:mt-20 w-full md:px-10">
            <HowItWorks />
          </section>
          <section id="#" className="mt-10 md:mt-20 w-full md:px-10">
            <Testimonials />
          </section>
          <section id="#" className="mt-10 md:mt-20 w-full md:px-10">
            <MedicalDisclaimer />
          </section>
          <section id="pricing" className="mt-10 md:mt-20 w-full md:px-10">
            <Pricing />
          </section>
          <section id="faqs" className="mt-10 md:mt-20 w-full md:px-10">
            <Faq />
          </section>
          <section id="#" className="mt-10 md:mt-20 w-full md:px-10">
            <FinalCTA />
          </section>
          <section id="#" className="mt-10 md:mt-20 w-full md:px-10">
             <Footer />
          </section>
        </main>
    </DotBackgroundDemo>
  );
}

export function MedicalDisclaimer() {
  return (
    <div className="w-full px-6 md:px-10 mt-10 mb-10">
      <div className="max-w-4xl mx-auto p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Important Medical Disclaimer</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Neuromed's AI assistant provides health information and suggestions based on your data, 
              but <strong>does not replace professional medical advice, diagnosis, or treatment</strong>. 
              Always consult qualified healthcare providers for medical conditions. 
              Medication suggestions are informational only - never self-medicate without consulting a doctor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}