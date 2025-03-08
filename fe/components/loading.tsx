import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020309]">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-4 border-[#0CC0DF] border-t-transparent"
        />
        
        {/* Inner pulsing circle */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0CC0DF] via-[#0CC0DF]/50 to-transparent rounded-full"
        />

        {/* Loading text */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[#0CC0DF] font-bold">
          Loading...
        </div>
      </div>
    </div>
  );
}
