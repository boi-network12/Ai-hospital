"use client";

import Image from "next/image";
import React from "react";
import Display1 from "@/assets/img/phone-display.png";
import Display2 from "@/assets/img/progress-display.png";
import Display3 from "@/assets/img/Input-display.png";
import { motion } from "framer-motion";

const Displays = () => {
  return (
    <div className="w-full p-15 flex-col flex items-center justify-center px-5">
      <div className="lg:w-6xl">
        
        {/* Paragraph 1 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-start font-medium text-gray-600 dark:text-gray-200 lg:text-3xl md:text-2xl text-lg mb-5"
        >
          Neuromed gives you a complete view of your health journey—from AI-powered symptom analysis to connecting with healthcare professionals. Everything stays organized in one secure place.
        </motion.p>

        {/* Paragraph 2 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-start font-medium text-gray-600 dark:text-gray-200 lg:text-3xl md:text-2xl text-lg mb-5"
        >
          Take control of your wellness with personalized insights, easy doctor access, and intelligent health tracking designed to keep you informed and proactive about your health.
        </motion.p>
      </div>

      {/* Image Group Wrapper (Fade + slide up) */}
      <motion.div
        className="relative mt-5"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Main Background Image */}
        <Image src={Display1} alt="img-1" className="w-full" />

        {/* Overlay Left Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute md:top-25 top-8 md:-left-25 -left-12"
        >
          <Image
            src={Display2}
            alt="img-2"
            className="md:w-[250px] w-[150px] aspect-auto"
          />
        </motion.div>

        {/* Overlay Right Image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="absolute md:bottom-15 bottom-8 md:-right-25 -right-12"
        >
          <Image
            src={Display3}
            alt="img-3"
            className="md:w-[250px] w-[150px] aspect-auto"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Displays;
