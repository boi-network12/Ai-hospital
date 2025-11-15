"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function FinalCTA() {
  const router = useRouter()

  return (
    <section className="mt-32 text-center px-6">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-2xl md:text-5xl font-semibold"
      >
        Start Managing Your Hospital the Smart Way
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
      >
        Join the next generation of healthcare systems.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 px-10 py-2 text-lg rounded-xs bg-[#8089ff] text-white hover:bg-[#767eee] transition"
        onClick={() => router.push("/join-waitlist")}
      >
        Join Waitlist
      </motion.button>
    </section>
  );
}
