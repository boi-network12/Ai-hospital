'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface Props extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
}

export const AnimatedSection = ({ children, delay = 0, ...rest }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7, delay }}
    {...rest}
  >
    {children}
  </motion.div>
);