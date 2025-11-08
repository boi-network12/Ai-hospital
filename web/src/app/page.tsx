"use client";

import DarkThemeLogo from "@/assets/img/dark-icon.png";
import LightThemeLogo from "@/assets/img/icon.png";

import { DotBackgroundDemo } from "@/UI/DotBackgroundDemo";
import Image from "next/image";
import { useTheme } from "next-themes";
import FormComponents from "@/components/HomeComponents/Form";
import { motion } from "framer-motion";

export default function Home() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen dark:bg-black bg-white">
      <DotBackgroundDemo>
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* Glow behind logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute -top-20 h-52 w-52 rounded-full blur-3xl ${
              resolvedTheme === "dark" ? "bg-gray-700/40" : "bg-gray-300/20"
            }`}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Image
                src={resolvedTheme === "dark" ? DarkThemeLogo : LightThemeLogo}
                alt="Neuromed logo"
                width={100}
                height={100}
                className="mb-6 rounded-full"
              />
            </motion.div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400"
            >
              NEUROMED
            </motion.span>

            {/* Heading */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="mt-4 text-2xl font-medium leading-tight text-gray-700 dark:text-white/80 md:text-4xl"
            >
              Join the waitlist for the
              <span className="block bg-gradient-to-r from-[#6b75ff] to-[#a78bff] bg-clip-text text-transparent">
                Neuromed
              </span>
              
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-4 max-w-md text-sm text-gray-600 dark:text-gray-400"
            >
              Be the first to experience AI-powered medical insights.
            </motion.p>
          </div>

          {/* Form with staggered entry */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="w-[320px] max-w-md"
          >
            <FormComponents />
          </motion.div>
        </section>
      </DotBackgroundDemo>
    </div>
  );
}