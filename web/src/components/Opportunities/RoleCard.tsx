'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  href: string;
  badge?: string;
}

export const RoleCard = ({
  icon,
  title,
  subtitle,
  gradient,
  href,
  badge,
}: Props) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="relative group"
  >
    <Link href={href}>
      <div
        className={`relative overflow-hidden rounded-3xl p-8 h-full bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/20 shadow-2xl`}
      >
        {badge && (
          <span className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold bg-white/20 backdrop-blur-md rounded-full text-white">
            {badge}
          </span>
        )}
        <div className="text-white">
          <div className="mb-6 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-2xl font-bold mb-3 font-pt-sans">{title}</h3>
          <p className="text-white/80 mb-6">{subtitle}</p>
          <div className="flex items-center gap-2 font-medium">
            Explore Opportunities{' '}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);