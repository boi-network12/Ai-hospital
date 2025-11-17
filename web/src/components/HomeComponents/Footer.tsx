"use client";

import { motion } from "framer-motion";
import { Twitter, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  // Smart link handler: scroll to ID or navigate
  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="mt-32 w-full border-t border-gray-200 dark:border-gray-800 py-14 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-10">

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
            <Link href="https://twitter.com/Neuro_medAi" target="_blank" rel="noopener">
              <FooterIcon icon={<Twitter size={20} />} />
            </Link>
            <Link href="mailto:neuromedication@gmail.com">
              <FooterIcon icon={<Mail size={20} />} />
            </Link>
          </div>
        </div>

        {/* Product Links */}
        <FooterSection
          title="Product"
          links={[
            { text: "Features", href: "#features" },
            { text: "Pricing", href: "#pricing" },
            { text: "Demo", href: "/demo" },
          ]}
          onClick={handleLinkClick}
        />

        {/* Company Links */}
        <FooterSection
          title="Company"
          links={[
            { text: "About", href: "/about" },
            { text: "Contact", href: "/contact" },
            { text: "Careers", href: "/careers" },
            { text: "Blog", href: "/blog" },
          ]}
          onClick={handleLinkClick}
        />

        {/* API Links */}
        <FooterSection
          title="API"
          links={[
            { text: "API Docs", href: "/api/docs" },
            { text: "API Status", href: "/api/status" },
            { text: "Integrations", href: "/api/integrations" },
            { text: "SDKs", href: "/api/sdk" },
          ]}
          onClick={handleLinkClick}
        />

        {/* Opportunities */}
        <FooterSection
          title="Opportunities"
          links={[
            { text: "Explore Opportunities", href: "/opportunities" },
          ]}
          onClick={handleLinkClick}
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

interface FooterLink {
  text: string;
  href: string;
}

function FooterSection({
  title,
  links,
  onClick,
}: {
  title: string;
  links: FooterLink[];
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
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
          <Link
            key={i}
            href={link.href}
            onClick={(e) => onClick(e, link.href)}
            {...(link.href.startsWith("http") || link.href.startsWith("mailto:")
              ? { target: "_blank", rel: "noopener" }
              : {})}
          >
            <li className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer capitalize">
              {link.text}
            </li>
          </Link>
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
