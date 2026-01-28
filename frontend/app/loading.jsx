"use client";

import { ErrorCard } from "@/components/ui/error-card";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const LoadingIllustration = () => (
  <motion.div
    animate={{
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <svg viewBox="0 0 200 200" className="w-full h-auto">
      <path
        fill="#A78BFA"
        d="M44.7,-67.3C57.3,-58.7,66.2,-43.9,72.5,-27.9C78.8,-11.9,82.5,5.3,77.2,18.7C71.9,32.1,57.6,41.7,42.9,52.4C28.2,63.1,13.1,74.9,-2.3,78.3C-17.7,81.7,-35.4,76.7,-49.6,65.8C-63.8,54.9,-74.5,38.1,-78.1,19.4C-81.7,0.7,-78.1,-19.9,-67.8,-36.2C-57.5,-52.5,-40.5,-64.5,-23.9,-71.3C-7.3,-78.1,9,-79.7,44.7,-67.3Z"
        transform="translate(100 100)"
      />
    </svg>
  </motion.div>
);

export default function Loading() {
  return (
    <ErrorCard
      type="loading"
      title={
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold"
        >
          Loading Content
        </motion.div>
      }
      description={
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg"
        >
          Please wait while we prepare your experience
        </motion.p>
      }
      illustration={<LoadingIllustration />}
      action={
        <div className="flex flex-col items-center gap-4 mt-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </motion.div>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto w-full">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                className="h-2 rounded-full bg-white/30 w-full"
              />
            ))}
          </div>
        </div>
      }
    />
  );
}