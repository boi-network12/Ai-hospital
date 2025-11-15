"use client";

import { motion } from "framer-motion";
import { Stethoscope, BarChart3, Users2, ShieldCheck, Layers, FileCheck2 } from "lucide-react";

const features = [
  {
    icon: <Stethoscope size={25} />,
    title: "Smart Patient Management",
    desc: "Track admissions, vitals, and care plans seamlessly across departments."
  },
  {
    icon: <BarChart3 size={25} />,
    title: "Real-time Analytics",
    desc: "Monitor performance, patient load, and hospital metrics instantly."
  },
  {
    icon: <Users2 size={25} />,
    title: "Staff Workflow Tools",
    desc: "Assign tasks, manage shifts, and coordinate teams efficiently."
  },
  {
    icon: <ShieldCheck size={25} />,
    title: "Secure & Compliant",
    desc: "HIPAA-grade security ensures patient data stays fully protected."
  },
  {
    icon: <Layers size={25} />,
    title: "Integrated Departments",
    desc: "Connect labs, pharmacy, triage, clinics, and admin in one system."
  },
  {
    icon: <FileCheck2 size={25} />,
    title: "Automated Billing",
    desc: "Generate invoices, track payments, and sync with insurance."
  },
];

export default function Features() {
  return (
    <section className="w-full mt-20 px-6 md:px-10">
      <h2 className="text-center text-3xl md:text-5xl font-medium mb-10">
        Powerful Features for Modern Hospitals
      </h2>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur border border-gray-200 dark:border-gray-700"
          >
            <div className="text-[#8089ff] dark:text-[#8089ff] mb-4">{item.icon}</div>
            <h3 className="text-xl font-semibold mb-2 font-pt-sans">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
