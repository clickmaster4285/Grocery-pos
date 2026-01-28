// components/ui/animated-background.jsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = ({ type = "404" }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="fixed inset-0 -z-10" />;

  // Background configurations for each error type
  const backgrounds = {
    "404": {
      gradient: "bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900",
      particles: 15,
      particleColor: "bg-purple-400/20"
    },
    "500": {
      gradient: "bg-gradient-to-br from-rose-900 via-red-900 to-amber-900",
      particles: 20,
      particleColor: "bg-rose-400/20"
    },
    "401": {
      gradient: "bg-gradient-to-br from-sky-900 via-sky-900 to-cyan-900",
      particles: 12,
      particleColor: "bg-sky-400/20"
    },
    "loading": {
      gradient: "bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900",
      particles: 10,
      particleColor: "bg-emerald-400/20"
    }
  };

  const config = backgrounds[type] || backgrounds["404"];

  return (
    <div className={`fixed inset-0 -z-10 ${config.gradient}`}>
      {[...Array(config.particles)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${config.particleColor}`}
          initial={{
            x: Math.random() * 100,
            y: Math.random() * 100,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: [null, Math.random() * 100],
            y: [null, Math.random() * 100],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}
    </div>
  );
};