'use client';

import { AnimatedSection } from './AnimatedSection';
import { RequirementItem } from './RequirementItem';
import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle2, Database, Laptop, Shield, Stethoscope, Terminal, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const NurseSection = () => (
  <section id="nurse-requirements" className="px-6 md:px-10 py-20">
    <div className="max-w-7xl mx-auto">
      <AnimatedSection>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Clinical Nursing Excellence</h2>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl">
          Help us design workflows that actually work in real hospitals.
        </p>
      </AnimatedSection>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Professional Credentials */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Professional Credentials</h3>
          <RequirementItem
            icon={<Shield className="w-5 h-5 text-emerald-500" />}
            title="RN License"
            desc="Active Registered Nurse license in good standing"
            mandatory
          />
          <RequirementItem
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            title="BSN Preferred"
            desc="Bachelor of Science in Nursing or equivalent"
            mandatory
          />
          <RequirementItem
            icon={<Stethoscope className="w-5 h-5 text-emerald-500" />}
            title="5+ Years Experience"
            desc="Bedside nursing in hospital setting"
            mandatory
          />
        </div>

        {/* Clinical Specializations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Clinical Specializations</h3>
          <RequirementItem
            icon={<Brain className="w-5 h-5 text-emerald-500" />}
            title="Critical Care"
            desc="ICU, ER, or CCU experience required"
            mandatory
          />
          <RequirementItem
            icon={<Users className="w-5 h-5 text-emerald-500" />}
            title="Charge Nurse"
            desc="Leadership and team coordination experience"
          />
          <RequirementItem
            icon={<Database className="w-5 h-5 text-emerald-500" />}
            title="EHR Systems"
            desc="Epic, Cerner, or Meditech proficiency"
          />
        </div>

        {/* Process Expertise */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Process Expertise</h3>
          <RequirementItem
            icon={<Terminal className="w-5 h-5 text-emerald-500" />}
            title="Workflow Design"
            desc="Experience improving clinical processes"
          />
          <RequirementItem
            icon={<Shield className="w-5 h-5 text-emerald-500" />}
            title="Quality Improvement"
            desc="Participation in QA/QI initiatives"
          />
          <RequirementItem
            icon={<Laptop className="w-5 h-5 text-emerald-500" />}
            title="Tech Adoption"
            desc="Led digital transformation projects"
          />
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} className="text-center">
        <Link
          href="/apply/nurse"
          className="inline-flex items-center gap-3 px-8 py-5 bg-emerald-500 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-600 transition-colors"
        >
          Apply as Clinical Nurse Expert <ArrowRight className="w-6 h-6" />
        </Link>
      </motion.div>
    </div>
  </section>
);