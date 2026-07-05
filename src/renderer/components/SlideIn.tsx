import React from 'react';
import { motion } from 'framer-motion';

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
}

export default function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration = 0.3,
}: SlideInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -20, opacity: 0 };
      case 'right':
        return { x: 20, opacity: 0 };
      case 'up':
        return { y: 20, opacity: 0 };
      case 'down':
        return { y: -20, opacity: 0 };
      default:
        return { x: -20, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
}
