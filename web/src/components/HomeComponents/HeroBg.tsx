"use client";

import Image from "next/image";
import React from "react";
import IphoneApp from "@/assets/img/iphone16.png";
import { motion } from "framer-motion";

const HeroBg = () => {
  return (
    <div className="flex flex-col items-center justify-start gap-10 px-5 pb-10 border-b border-b-gray-200 dark:border-b-gray-500">
      
      {/* Tagline */}
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="capitalize font-semibold text-gray-400 dark:text-gray-600 text-xl"
      >
        the apps to conquer any hospital
      </motion.span>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-3xl md:text-6xl text-center font-medium font-pt-sans"
      >
        All Your Hospital Operations.
        <br /> One Intelligent Platform.
      </motion.h1>

      {/* Paragraph */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-xl text-center text-gray-600 dark:text-gray-400 md:font-mono font-light"
      >
        Neuromed centralizes care, records, billing, and analytics into a single
        system for smoother hospital operations.
      </motion.p>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <Image src={IphoneApp} alt="iphone bg" priority className="w-full" />
      </motion.div>

    </div>
  );
};

export default HeroBg;
