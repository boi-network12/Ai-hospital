'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  desc: string;
  mandatory?: boolean;
}

export const RequirementItem = ({
  icon,
  title,
  desc,
  mandatory,
}: Props) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm"
  >
    <div className="w-10 h-10 rounded-lg bg-[#8089ff]/10 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold">{title}</h4>
        {mandatory && (
          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
            Required
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  </motion.div>
);