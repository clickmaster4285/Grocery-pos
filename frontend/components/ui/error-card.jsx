"use client"
import { motion } from "framer-motion";
import { AnimatedBackground } from "./animated-background";

export const ErrorCard = ({
  title,
  description,
  code,
  illustration,
  action,
  type = "404",
}) => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
     <AnimatedBackground type={type} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen flex items-center justify-center p-4 relative z-10"
      >
        <div className="relative max-w-4xl w-full">
          <div className="absolute -inset-4 bg-linear-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-75"></div>

          <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div className="flex flex-col justify-center space-y-6">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-9xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-600"
                >
                  {code}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-bold text-white"
                >
                  {title}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg text-white/80"
                >
                  {description}
                </motion.div>

                {action && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {action}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  {illustration}
                </motion.div>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 -z-10">
            <motion.div
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-64 h-64 rounded-full bg-purple-500/20 blur-xl"
            ></motion.div>
          </div>

          <div className="absolute bottom-0 left-0 -z-10">
            <motion.div
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
                rotate: [0, -10, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="w-96 h-96 rounded-full bg-pink-500/20 blur-xl"
            ></motion.div>
          </div>
        </div>
      </motion.div>
      </div>
  );
};