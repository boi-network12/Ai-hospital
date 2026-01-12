"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const questions = [
  {
    q: "Can Neuromed's AI diagnose my condition?",
    a: "No. Neuromed's AI provides health information and suggestions based on symptoms and your data, but cannot diagnose medical conditions. Always consult a doctor for diagnosis and treatment."
  },
  {
    q: "Is my health data private and secure?",
    a: "Yes. We use HIPAA-compliant encryption and give you full control over your data. You decide what to share and with whom."
  },
  {
    q: "How does the AI suggest medications?",
    a: "Our AI analyzes your health data, symptoms, and medical history to suggest possible medications. These are informational suggestions only - always consult a doctor before taking any medication."
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mt-28 px-6 md:px-10 max-w-4xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-medium mb-14">
        Frequently Asked Questions
      </h2>

      <div className="space-y-5">
        {questions.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="p-5 rounded-xl bg-white/40 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700"
          >
            <button
              onClick={() => setOpen(open === idx ? null : idx)}
              className="w-full flex justify-between items-center"
            >
              <span className="text-base md:text-lg font-medium font-pt-sans">{item.q}</span>
              <span>{open === idx ? "-" : "+"}</span>
            </button>

            {open === idx && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-gray-600 dark:text-gray-300"
              >
                {item.a}
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
