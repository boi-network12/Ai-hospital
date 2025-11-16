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