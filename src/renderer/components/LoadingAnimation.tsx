import React from 'react';
import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  message?: string;
}

export default function LoadingAnimation({ message = 'Loading...' }: LoadingAnimationProps) {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <motion.div
        className="flex gap-2"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-synapse-accent"
            variants={dotVariants}
          />
        ))}
      </motion.div>
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
