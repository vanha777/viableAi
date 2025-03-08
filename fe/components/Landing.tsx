'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Landing() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  }

  const benefits = [
    {
      title: "Build Unwavering Conviction",
      description: "Our AI agent helps you develop rock-solid belief in your idea before pitching to anyone else.",
      icon: "/icons/validate.svg"
    },
    {
      title: "Focused Direction",
      description: "Channel your energy into one clear direction with superhuman focus and strategic precision.",
      icon: "/icons/collaborate.svg"
    },
    {
      title: "Evidence-Based Validation",
      description: "Build compelling proof of concept with market evidence before investing in development.",
      icon: "/icons/secure.svg"
    }
  ]

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center px-4 md:px-8 py-16 md:py-24">
      {/* Animated background */}
      <div className="absolute inset-0 bg-black">
        {/* Glowing orbs */}
        {/* <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#E0FF00] rounded-full filter blur-[150px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#E0FF00] rounded-full filter blur-[150px] opacity-20" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#E0FF00] rounded-full filter blur-[180px] opacity-10" /> */}
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.png')] opacity-15"
          style={{ backgroundSize: '50px 50px' }} />
          
        {/* Digital circuit pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E0FF00_1px,transparent_1px)]" 
          style={{ backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-gray-100">BUILD FOUNDER</span>
            <br />
            <span className="bg-gradient-to-r from-[#E0FF00] via-[#E0FF00] to-[#E0FF00]/80 bg-clip-text text-transparent">
              CONVICTION
            </span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mb-8">
            ConvictionAI is the AI agent that helps founders build unwavering belief in their ideas,
            gather evidence, and validate demand before building their MVP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-[#E0FF00] text-gray-900 font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-[#E0FF00]/20"
            >
              Test Your Idea
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gray-800 text-[#E0FF00] font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-[#E0FF00]/30"
            >
              See How It Works
            </motion.button> */}
          </div>
        </motion.div>

        <motion.div
          className="relative w-full max-w-5xl mx-auto mb-24"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl p-4 border border-gray-700">
            {/* Display landing image */}
            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-inner">
              <Image 
                src="/landing.jpeg" 
                alt="ConvictionAI Landing" 
                width={1200} 
                height={675}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#E0FF00]/20 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#E0FF00]/20 rounded-full blur-xl" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gray-800 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-700 hover:border-[#E0FF00]/50"
            >
              <div className="w-16 h-16 bg-[#E0FF00] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                <img 
                  src={benefit.icon} 
                  alt={benefit.title} 
                  className="w-8 h-8 text-gray-900" 
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#E0FF00]">
                {benefit.title}
              </h3>
              <p className="text-gray-300">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-24 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            <span className="text-[#E0FF00]">
              Don't miss the "V" in your MVP
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-8">
            Over 80% of startups fail because they build products nobody wants. 
            ConvictionAI helps you validate before you build.
          </p>
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-24 h-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-sm">
                <span className="text-[#E0FF00] font-medium">Success {i}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}