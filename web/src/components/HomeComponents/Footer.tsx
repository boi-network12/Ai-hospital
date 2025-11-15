"use client";

import { motion } from "framer-motion";
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-32 w-full border-t border-gray-200 dark:border-gray-800 py-14 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold"
          >
            Neuromed
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 mt-3 text-sm"
          >
            Smarter tools for hospitals to work faster, safer, and more connected.
          </motion.p>

          {/* Social icons */}
          <div className="flex items-center gap-4 mt-5">
            <FooterIcon icon={<Facebook size={20} />} />
            <FooterIcon icon={<Twitter size={20} />} />
            <FooterIcon icon={<Linkedin size={20} />} />
            <FooterIcon icon={<Mail size={20} />} />
          </div>
        </div>

        {/* Product Links */}
        <FooterSection
          title="Product"
          links={["Features", "Pricing", "Dashboard", "Demo"]}
        />

        {/* Company Links */}
        <FooterSection
          title="Company"
          links={["About", "Contact", "Careers", "Blog"]}
        />

        {/* Support Links */}
        <FooterSection
          title="Support"
          links={["Help Center", "Documentation", "Terms", "Privacy Policy"]}
        />

      </div>

      {/* Bottom */}
      <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-16">
        © {new Date().getFullYear()} Neuromed. All rights reserved.
      </div>
    </footer>
  );
}

/* ---------------------------------- */
/*     Footer Reusable Components     */
/* ---------------------------------- */

function FooterSection({ title, links }: { title: string; links: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="font-semibold mb-4">{title}</h3>

      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
        {links.map((link, i) => (
          <li
            key={i}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            {link}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function FooterIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.15 }}
      className="p-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
    >
      {icon}
    </motion.div>
  );
}
