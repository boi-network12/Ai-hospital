"use client";

import { Mail, User } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function FormComponents() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [submittedEmails, setSubmittedEmails] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(); // SSR safe
    const stored = localStorage.getItem("waitlistEmails");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });


useEffect(() => {
  const stored = localStorage.getItem("waitlistEmails");
  if (stored) {
    setTimeout(() => {
      setSubmittedEmails(new Set(JSON.parse(stored)));
    }, 0);
  }
}, []);



  const saveEmailsToLocal = (emails: Set<string>) => {
    localStorage.setItem("waitlistEmails", JSON.stringify(Array.from(emails)));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name required";
    if (!email.trim()) e.email = "Email required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicate(false);
    if (!validate()) return;

    if (submittedEmails.has(email.toLowerCase())) {
      setDuplicate(true);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("_captcha", "false");

    try {
      const response = await fetch("https://formsubmit.co/ajax/neuromedication@gmail.com", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        const updatedEmails = new Set(submittedEmails);
        updatedEmails.add(email.toLowerCase());
        setSubmittedEmails(updatedEmails);
        saveEmailsToLocal(updatedEmails);

        setSubmitted(true);
        setName("");
        setEmail("");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Submission failed. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="mt-10 text-center text-lg font-semibold text-green-600">
        ✅ You’re on the waitlist!
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mt-10 flex w-full flex-col items-center space-y-4 sm:space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* Name Field */}
      <motion.div
        variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className="relative w-full"
      >
        <div className="flex items-center gap-2 rounded-xl border-2 p-2.5 sm:p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-black">
          <User className="h-4 w-4 text-gray-400 dark:text-gray-500 sm:h-5 sm:w-5" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 sm:text-lg"
          />
        </div>
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </motion.div>

      {/* Email Field */}
      <motion.div
        variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className="relative w-full"
      >
        <div className="flex items-center gap-2 rounded-xl border-2 p-2.5 sm:p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-black">
          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 sm:h-5 sm:w-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 sm:text-lg"
          />
        </div>
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        {duplicate && <p className="text-red-500 text-sm mt-1">Email is already in the waitlist.</p>}
      </motion.div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group mt-2 w-full rounded-xl bg-gradient-to-r from-[#6b75ff] to-[#a78bff] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b75ff]/30 sm:py-3"
      >
        <span className="flex items-center justify-center text-sm sm:text-base">
          Join the waitlist
          <svg
            className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </span>
      </motion.button>
    </motion.form>
  );
}
