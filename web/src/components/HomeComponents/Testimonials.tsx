"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "App User",
    duration: "Using Neuromed for 6 months",
    text: "The AI assistant helped me identify symptoms I overlooked. Connected me with a specialist who confirmed the issue early."
  },
  {
    name: "Michael Chen",
    role: "Diabetes Patient",
    duration: "Regular user for 1 year",
    text: "Daily health tracking and AI insights have completely transformed how I manage my condition between doctor visits."
  },
  {
    name: "Dr. Amanda Rodriguez",
    role: "Cardiologist",
    hospital: "City Medical Center",
    text: "Neuromed provides my patients with better pre-visit information, making consultations more productive."
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
