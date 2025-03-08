'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#E0FF00] rounded-full filter blur-[120px] opacity-10" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#E0FF00] rounded-full filter blur-[120px] opacity-10" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-2xl font-extrabold tracking-tight text-[#E0FF00] flex items-center">
              <div className="mr-2 w-8 h-8 rounded-md bg-[#E0FF00] flex items-center justify-center text-gray-900 text-xs">
                AI
              </div>
              Conviction<span className="text-3xl">AI</span>
            </span>
          </motion.div>

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-serif italic text-[#E0FF00] font-bold"
          >
            Don't skip the "V" in "MVP"
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/dashboard"
              className="inline-block bg-[#E0FF00] text-gray-900 px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
            >
              Try For Free
            </Link>
          </motion.div>
        </div>

        {/* Copyright - Bottom Center */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-gray-400 text-sm mt-6 border-t border-gray-700 pt-4"
        >
          <p>© 2025 ConvictionAI. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  )
}
