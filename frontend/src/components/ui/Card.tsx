'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Card({ children, className = '', delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`bg-white rounded-2xl p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-1 benefit-card ${className}`}
    >
      {children}
    </motion.div>
  );
}
