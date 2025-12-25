"use client";

import { DotBackgroundDemo } from '@/UI/DotBackgroundDemo'
import React, { useEffect, useState } from 'react'
import Logo from "@/assets/img/logo.png"
import Image from 'next/image'
import AvatarHead1 from "@/assets/img/image.png"
import AvatarHead2 from "@/assets/img/AvatarHead2.jpg"
import AvatarHead3 from "@/assets/img/AvatarHead3.webp"
import { motion } from "framer-motion";
import Script from 'next/script';

// Add this structured data export
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Neuromed Waitlist",
  "description": "Join the waitlist for early access to AI-powered healthcare platform",
  "url": "https://neuromed.sbs/waitlist",
  "publisher": {
    "@type": "Organization",
    "name": "Neuromed",
    "logo": {
      "@type": "ImageObject",
      "url": "https://neuromed.sbs/logo.png"
    }
  },
  "mainEntity": {
    "@type": "Event",
    "name": "Neuromed Platform Launch",
    "startDate": "2024-12-31",
    "endDate": "2024-12-31",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": "https://neuromed.sbs"
    },
    "description": "Early access to AI-powered healthcare platform",
    "organizer": {
      "@type": "Organization",
      "name": "Neuromed",
      "url": "https://neuromed.sbs"
    }
  }
};

const JoinWaitList = () => {
      const [email, setEmail] = useState("");
      const [errors, setErrors] = useState<{ email?: string }>({});
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

    try {
        const response = await fetch("https://formspree.io/f/xldanbjl", { 
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.ok) {
        const updated = new Set(submittedEmails);
        updated.add(email.toLowerCase());
        setSubmittedEmails(updated);
        saveEmailsToLocal(updated);
        
        setSubmitted(true);
        setEmail("");
        } else {
        alert("Something went wrong. Try again.");
        }
    } catch (error) {
        alert("Network error. Try again.");
        console.error("error", error)
    }
    };


  if (submitted) {
    return (
      <div className="mt-10 text-center text-lg font-semibold text-green-600">
        ✅ You’re on the waitlist!
      </div>
    );
  }

    const avatars = [
        { id: 1, src: AvatarHead1 },
        { id: 2, src: AvatarHead2 },
        { id: 3, src: AvatarHead3 },
    ];

    // Form stagger animations
    const formParent = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const formItem = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

  return (
    <DotBackgroundDemo>
        <main className="w-full min-h-screen flex flex-col items-center justify-center">

            <motion.div 
                className="p-5 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
            >

                {/* Logo Animation */}
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <Image
                        src={Logo}
                        alt='logo'
                        priority
                        className='w-[70px] border border-gray-300 rounded-2xl mb-10'
                    />
                </motion.div>

                {/* Heading */}
                <motion.h1
                    className='text-3xl font-pt-sans mb-2 text-gray-700 dark:text-gray-300 text-center'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    Break Bad Habits. Build Better Ones—For Life.
                </motion.h1>

                {/* Subtext */}
                <motion.span
                    className='text-base font-pt-sans mb-3 text-gray-700 dark:text-gray-300 text-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    Join the waitlist and be one of the first to experience the new way to build better habits.
                </motion.span>

                {/* Form with stagger animation */}
                <motion.form
                    action=""
                    onSubmit={handleSubmit}
                    className='flex md:flex-row flex-col gap-3 mt-20 w-full max-w-lg'
                    variants={formParent}
                    initial="hidden"
                    animate="show"
                >

                    <motion.input
                        variants={formItem}
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='Enter your email'
                        className='border border-gray-200 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 px-5 h-12 rounded-4xl w-full outline-0'
                    />

                    <motion.button
                        variants={formItem}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type='submit'
                        className='border border-gray-100 dark:border-gray-700 bg-[#8089ff] w-full md:w-[200px] cursor-pointer rounded-4xl h-12 text-gray-50 font-semibold'
                    >
                        Join Waitlist
                    </motion.button>

                </motion.form>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                {duplicate && <p className="text-red-500 text-sm mt-1">Email is already in the waitlist.</p>}

                {/* Avatar stack + text */}
                <motion.div
                    className="flex flex-row items-center justify-center gap-5 mt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    {/* Avatar Stack */}
                    <motion.div
                        className="flex items-center -space-x-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        {avatars.map((a, i) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 }}
                            >
                                <Image
                                    src={a.src}
                                    alt="avatar"
                                    width={40}
                                    height={40}
                                    className="rounded-full border-2 border-white dark:border-gray-800"
                                />
                            </motion.div>
                        ))}

                        {/* +21.7k bubble */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: avatars.length * 0.15 }}
                            className="w-10 h-10 rounded-full bg-[#8089ff] text-white flex items-center justify-center border-2 border-white dark:border-gray-800 text-xs font-semibold"
                        >
                            +21.7k
                        </motion.div>
                    </motion.div>

                    {/* Under text */}
                    <motion.p
                        className="text-gray-700 dark:text-gray-300 text-sm font-pt-sans"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        Over <span className="font-bold">38,068+</span> people have already joined.
                    </motion.p>
                </motion.div>

            </motion.div>
            <Script id="waitlist-structured-data" type="application/ld+json">
               {JSON.stringify(structuredData)}
            </Script>
        </main>
    </DotBackgroundDemo>
  )
}

export default JoinWaitList;
