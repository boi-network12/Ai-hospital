'use client';

import { AnimatedSection } from './AnimatedSection';
import { RequirementItem } from './RequirementItem';
import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle2, Database, Laptop, Shield, Stethoscope, Terminal, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const DoctorSection = () => (
  <section id="doctor-requirements" className="px-6 md:px-10 py-20 bg-gray-50 dark:bg-gray-900/50">
    <div className="max-w-7xl mx-auto">
      <AnimatedSection>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Medical Leadership</h2>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl">
          Lead the design of intelligent clinical decision support systems.
        </p>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Requirements */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Extensive Requirements</h3>
          <div className="space-y-4">
            <RequirementItem
              icon={<Shield className="w-5 h-5 text-rose-500" />}
              title="Board Certification"
              desc="Active board certification in specialty"
              mandatory
            />
            <RequirementItem
              icon={<Stethoscope className="w-5 h-5 text-rose-500" />}
              title="10+ Years Practice"
              desc="Extensive clinical experience required"
              mandatory
            />
            <RequirementItem
              icon={<Brain className="w-5 h-5 text-rose-500" />}
              title="Academic Affiliation"
              desc="Teaching hospital or university role"
              mandatory
            />
            <RequirementItem
              icon={<Users className="w-5 h-5 text-rose-500" />}
              title="Department Leadership"
              desc="Current or former department head"
              mandatory
            />
            <RequirementItem
              icon={<Database className="w-5 h-5 text-rose-500" />}
              title="Research Publications"
              desc="10+ peer-reviewed publications"
              mandatory
            />
            <RequirementItem
              icon={<Laptop className="w-5 h-5 text-rose-500" />}
              title="AI/ML Experience"
              desc="Prior work with clinical AI systems"
            />
            <RequirementItem
              icon={<Terminal className="w-5 h-5 text-rose-500" />}
              title="Protocol Design"
              desc="Developed hospital-wide protocols"
            />
            <RequirementItem
              icon={<CheckCircle2 className="w-5 h-5 text-rose-500" />}
              title="Quality Metrics"
              desc="Improved outcomes with data-driven approaches"
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} className="mt-8">
            <Link
              href="/apply/doctor"
              className="inline-flex items-center gap-3 px-6 py-4 bg-rose-500 text-white rounded-2xl font-semibold hover:bg-rose-600 transition-colors"
            >
              Apply as Medical Director <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        {/* Impact Areas */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Leadership Impact Areas</h3>
          <div className="space-y-6">
            {[
              {
                title: 'Clinical Decision Intelligence',
                desc: 'Design AI systems that support real-time clinical decisions with evidence-based protocols.',
              },
              {
                title: 'Patient Flow Optimization',
                desc: 'Reduce wait times and improve outcomes through intelligent resource allocation.',
              },
              {
                title: 'Quality & Safety',
                desc: 'Implement predictive analytics to prevent adverse events and improve care quality.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
              >
                <h4 className="font-semibold text-rose-700 dark:text-rose-400 mb-3">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);