"use client";

import { motion } from "framer-motion";

const tiers = [
  {
    name: "Basic",
    price: "Coming Soon",
    features: ["Patient Management", "Basic Analytics", "Staff Tools"]
  },
  {
    name: "Professional",
    price: "Coming Soon",
    features: ["All Basic Features", "Billing & Insurance", "Inventory & Pharmacy", "Advanced Analytics"]
  },
  {
    name: "Enterprise",
    price: "Coming Soon",
    features: ["Unlimited Departments", "Dedicated Support", "Full Integration", "Custom Workflows"]
  },
];


export default function Pricing() {
  return (
    <section className="mt-28 px-6 md:px-10 max-w-7xl mx-auto">
      <h2 className="text-center text-3xl md:text-5xl font-medium mb-16">
        Simple, Transparent Pricing
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white/40 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 backdrop-blur"
          >
            <h3 className="text-lg font-medium ">{tier.name}</h3>
            <div className="text-3xl font-bold my-4 font-pt-sans">{tier.price}</div>

            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              {tier.features.map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
            </ul>

            <button className="mt-6 w-full py-2 rounded-xl bg-[#8089ff] text-white hover:bg-[#6870eb] transition">
              Choose Plan
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
