"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "1",
    title: "Set up your workspace",
    desc: "Create your hospital environment and add departments in minutes."
  },
  {
    step: "2",
    title: "Connect your staff",
    desc: "Invite nurses, doctors, admins, and assign roles instantly."
  },
  {
    step: "3",
    title: "Integrate patient records",
    desc: "Upload existing data or sync records automatically."
  },
  {
    step: "4",
    title: "Monitor in real-time",
    desc: "Watch every department update live as operations flow."
  },
];

export default function HowItWorks() {
  return (
    <section className="mt-28 px-6 md:px-10 max-w-7xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-medium mb-16">
        How Neuromed Works
      </h2>

      <div className="grid md:grid-cols-4 gap-8">
        {steps.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="p-6 text-center rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur border border-gray-100 dark:border-gray-700"
          >
            <div className="text-3xl font-bold text-[#8089ff] dark:text-[#8089ff] mb-3">
              {item.step}
            </div>
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
