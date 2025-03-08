'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Features() {
  const [cardOrder, setCardOrder] = useState([0, 1, 2])
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

  const rotateCards = () => {
    setCardOrder(prev => [(prev[1]), (prev[2]), (prev[0])])
  }

  const cards = [
    {
      title: "Market Validation",
      description: "Our AI analyzes market trends, competitor landscapes, and customer pain points to help validate your idea with real-world evidence before you invest resources.",
      image: "/login.jpeg"
    },
    {
      title: "Conviction Building",
      description: "Transform uncertainty into unwavering belief. ConvictionAI helps founders develop the superhuman focus needed to persevere through challenges by building evidence-based confidence.",
      image: "/voting.jpeg"
    },
    {
      title: "Strategic Direction",
      description: "Channel your energy in one clear direction with actionable insights and roadmaps based on validated market needs and opportunities.",
      image: "/verified.jpeg"
    },
    {
      title: "Proof of Concept Development",
      description: "Build compelling evidence and demonstrations that validate your solution before investing in a full MVP, ensuring you don't miss the 'V' in MVP.",
      image: "/chain_verified.jpeg",
    },
    {
      title: "Demand Validation",
      description: "Test customer acquisition channels, willingness to pay, and engagement metrics to prove demand exists before spending resources on development.",
      image: "/partner.jpeg",
    }
  ];


  return (
    <section className="relative overflow-hidden flex items-center justify-center px-2 md:px-4 text-gray-800 py-24 bg-gray-50">
      <motion.div
        className="w-full relative z-10 px-4 md:px-8 lg:px-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-left my-32">
          <span className="text-gray-800">CONVICTION BEFORE</span>
          <br className="mb-12" />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CODE</span>
        </h1>
        <div className="flex flex-col gap-48 w-full max-w-7xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16 w-full bg-base-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-blue-400`}
            >
              {/* Text Content */}
              <div className="w-full md:w-1/2 text-left">
                <h2 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {card.title}
                </h2>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Image Display */}
              <div className="w-full md:w-1/2 relative aspect-[4/3]">
                <div className="relative w-full h-full rounded-xl overflow-hidden 
                  transform transition-all duration-500 hover:scale-105 
                  shadow-lg hover:shadow-2xl border-4 border-white
                  group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    priority
                    loading="eager"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}