'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Starters() {
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
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  }

  const convictionTools = [
    {
      title: "Market Validation Framework",
      description: "Our step-by-step framework for validating your idea with real market evidence before building anything.",
      image: "/rewards.jpeg",
      link: "#"
    },
    {
      title: "Customer Insight Generator",
      description: "Generate deep customer insights and validate pain points to ensure you're solving a real problem worth solving.",
      image: "/starter1.jpeg",
      link: "#"
    },
    {
      title: "Evidence Collection Toolkit",
      description: "Structured methodology for gathering compelling evidence that builds conviction in your idea and persuades others.",
      image: "/starter2.jpg",
      link: "#"
    },
    {
      title: "MVP Roadmap Builder",
      description: "Plan your Minimum Viable Product with validation at every step, ensuring you don't miss the 'V' in MVP.",
      image: "/starter3.png",
      link: "#"
    }
  ];

  return (
    <section className="relative overflow-hidden flex items-center justify-center px-2 md:px-4 py-24 bg-white">
      <motion.div
        className="w-full relative z-10 px-4 md:px-8 lg:px-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-left my-32">
          <span className="text-gray-800">CONVICTION</span>
          <br className="mb-12" />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">TOOLKIT</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {convictionTools.map((tool, index) => (
            <motion.a
              key={index}
              href={tool.link}
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 border border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 block"
            >
              <div className="relative w-full aspect-video mb-4 rounded-xl overflow-hidden">
                <Image
                  src={tool.image}
                  alt={tool.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {tool.title}
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed">
                {tool.description}
              </p>
            </motion.a>
          ))}
        </div>

        <div className="mt-32 grid grid-cols-1 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-gray-200 hover:border-blue-400 shadow-sm flex flex-col items-center justify-center text-center h-fit">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Ready to build your conviction?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl">Get started with ConvictionAI today and transform your idea into a validated concept with evidence that convinces investors, partners, and yourself.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
            </motion.button>
            <p className="text-gray-500 text-sm mt-3">No credit card required</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}