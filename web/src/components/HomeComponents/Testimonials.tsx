"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Dr. Chinedu Okafor",
    role: "Chief Medical Director",
    hospital: "Unity General Hospital",
    text: "Neuromed improved our patient flow by nearly 40%. The difference is night and day."
  },
  {
    name: "Nurse Sarah Mensah",
    role: "Head Nurse",
    hospital: "CityCare Clinic",
    text: "Task management and alerts have cut down our delays drastically. It’s a lifesaver."
  },
  {
    name: "Emeka Lawal",
    role: "Hospital Administrator",
    hospital: "PrimeHealth Center",
    text: "Billing automation alone saves us hours every day. Absolutely worth it."
  },
];

export default function Testimonials() {
  return (
    <section className="mt-28 px-6 md:px-10 max-w-7xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-medium mb-12">
        Trusted by Healthcare Professionals
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white/40 dark:bg-gray-800/40 border backdrop-blur border-gray-100 dark:border-gray-700"
          >
            <p className="text-gray-700 dark:text-gray-300 italic">“{item.text}”</p>
            <div className="mt-4 font-semibold">{item.name}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {item.role} — {item.hospital}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
