'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  onClick?: () => void;
  icon?: ReactNode;
  groupHover?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  icon,
  groupHover = false
}: ButtonProps) {
  const baseStyles = "px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer";
  
  const variants = {
    primary: "bg-primary text-white shadow-[0_4px_14px_0_rgba(31,122,99,0.39)] hover:shadow-[0_6px_20px_rgba(31,122,99,0.23)] hover:bg-primary-light",
    secondary: "bg-white text-primary border-2 border-primary/20 hover:bg-bg-warm hover:border-primary",
    accent: "bg-secondary text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/40"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className} ${groupHover ? 'group' : ''}`}
    >
      {children}
      {icon && (
        <span className={groupHover ? "group-hover:translate-x-1 transition-transform" : ""}>
          {icon}
        </span>
      )}
    </motion.button>
  );
}
