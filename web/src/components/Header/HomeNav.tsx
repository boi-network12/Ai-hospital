import Link from 'next/link'
import React from 'react'
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const HomeNav = () => {

  const _navs = [
    { title: "Home", link: "/" },
    { title: "FAQs", link: "#faqs" },
    { title: "Pricing", link: "#pricing" },
  ];

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full h-15 md:h-20 flex items-center flex-row justify-between fixed top-0 border-b border-b-gray-200 dark:border-b-gray-900 z-20 backdrop-blur-xs px-5 md:px-10 lg:px-28"
    >
      {/* Logo */}
      <motion.h1
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-2xl font-bold text-heading text-gray-700 dark:text-gray-400"
      >
        Neuromed
      </motion.h1>

      {/* Nav Items */}
      <ul className="hidden md:flex gap-7 items-center justify-center">
        {_navs.map((item, index) => (
          <Link href={item.link} key={index}>
            <motion.li
              whileHover={{ scale: 1.1, color: "#fff" }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-gray-400 font-medium text-base cursor-pointer"
            >
              {item.title}
            </motion.li>
          </Link>
        ))}
      </ul>

      {/* CTA */}
      <Link href="/join-waitlist">
        <motion.p
          whileHover={{ x: 5, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex flex-row items-center gap-2 text-base text-gray-600  dark:text-gray-300 cursor-pointer"
        >
          Join Waitlist 
          <ArrowRight className="w-5 h-5 " />
        </motion.p>
      </Link>
    </motion.div>
  );
};

export default HomeNav;
