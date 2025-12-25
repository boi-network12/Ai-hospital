'use client';

import { AnimatedSection } from './AnimatedSection';
import { RequirementItem } from './RequirementItem';
import { RoleCard } from './RoleCard';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Cloud, Code2, Database, Laptop } from 'lucide-react';
import { motion } from 'framer-motion';

export const TechSection = () => (
  <section id="tech-requirements" className="px-6 md:px-10 py-20 bg-gray-50 dark:bg-gray-900/50">
    <div className="max-w-7xl mx-auto">
      <AnimatedSection>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#8089ff] flex items-center justify-center">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Tech & Engineering Roles</h2>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl">
          Join our engineering team to build the most advanced hospital intelligence platform.
        </p>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Requirements */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Minimum Requirements</h3>
          <div className="space-y-4">
            <RequirementItem
              icon={<CheckCircle2 className="w-5 h-5 text-[#8089ff]" />}
              title="3+ Years Experience"
              desc="Professional experience in software development"
              mandatory
            />
            <RequirementItem
              icon={<Laptop className="w-5 h-5 text-[#8089ff]" />}
              title="Modern Stack"
              desc="Proficiency in React, Node.js, TypeScript, or Python"
              mandatory
            />
            <RequirementItem
              icon={<Database className="w-5 h-5 text-[#8089ff]" />}
              title="System Design"
              desc="Experience with distributed systems and microservices"
            />
            <RequirementItem
              icon={<Cloud className="w-5 h-5 text-[#8089ff]" />}
              title="Cloud Platforms"
              desc="AWS, GCP, or Azure experience preferred"
            />
          </div>

          {/* <motion.div whileHover={{ scale: 1.02 }} className="mt-8">
            <Link
              href="#"
              className="inline-flex items-center gap-3 px-6 py-4 bg-[#8089ff] text-white rounded-2xl font-semibold hover:bg-[#6a73ff] transition-colors cursor-progress"
            >
              Apply as Engineer <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div> */}
        </div>

        {/* Positions */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Available Positions</h3>
          <div className="space-y-4">
            {[
              'Senior Full-Stack Engineer',
              'AI/ML Engineer',
              'DevOps Lead',
              'Mobile Engineer (React Native)',
              'Data Engineer',
            ].map((role) => (
              <motion.div
                key={role}
                whileHover={{ x: 8 }}
                className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{role}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remote • Full-time • Equity
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#8089ff] transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
