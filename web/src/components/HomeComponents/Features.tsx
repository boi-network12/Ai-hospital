"use client";

import { motion } from "framer-motion";
import { Stethoscope, BarChart3, Users2, ShieldCheck, Layers, FileCheck2, MessageSquare, UserCheck, Brain, Activity } from "lucide-react";

const features = [
  {
    icon: <Stethoscope size={25} />,
    title: "AI Health Assistant",
    desc: "Get personalized health advice and symptom analysis from our AI, with proper disclaimers for medical guidance."
  },
  {
    icon: <MessageSquare size={25} />, // You'll need to import this icon
    title: "Doctor Discovery & Booking",
    desc: "Find, message, and book appointments with verified doctors and specialists in your area."
  },
  {
    icon: <Activity size={25} />, // You'll need to import this icon
    title: "Health Data Analysis",
    desc: "Connect wearables to track vitals, analyze patterns, and get AI-powered insights about your health."
  },
  {
    icon: <ShieldCheck size={25} />,
    title: "Personalized Medication",
    desc: "AI suggests medications based on your health data and history, not generic recommendations."
  },
  {
    icon: <UserCheck size={25} />, // You'll need to import this icon
    title: "Complete User Control",
    desc: "You own your data. Full authority over your health information and privacy settings."
  },
  {
    icon: <Brain size={25} />, // You'll need to import this icon
    title: "Smart Health Monitoring",
    desc: "Daily activity analysis, health checkup tracking, and personalized wellness recommendations."
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
