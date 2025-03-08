'use client'

import { motion } from 'framer-motion'
import { FaCheck } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import NavBar from '@/components/NavBar'

export default function Pricing() {
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

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for testing and small projects",
      features: [
        "Up to 1,000 transactions/month",
        "Up to 100 players",
        "Basic API access",
        "Community support",
        "Basic analytics",
        "Single chain support"
      ]
    },
    {
      name: "Pro",
      price: "$20",
      description: "Ideal for growing games and applications",
      features: [
        "Up to 100,000 transactions/month",
        "Up to 1000 players",
        "Advanced API access",
        "Priority support",
        "Advanced analytics",
        "Multi-chain support",
        "Custom webhooks",
        "Dedicated account manager"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large-scale operations and special requirements",
      features: [
        "Unlimited transactions",
        "Unlimited players",
        "Full API access",
        "24/7 dedicated support",
        "Custom analytics",
        "Multi-chain support",
        "Custom development",
        "SLA guarantee",
        "Custom integration support"
      ]
    }
  ]

  return (
    <>
      <NavBar />
      <section className="bg-[#010205] relative overflow-hidden flex items-center justify-center px-2 md:px-4 text-white min-h-screen">
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0">
          {/* Dark gradient overlay */}
          <div className="absolute w-full h-full bg-gradient-to-b from-[#010205] via-[#010205]/90 to-[#010205]" />

          {/* Horizontal lines */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`h-${i}`}
                initial={{ opacity: 0.2 }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  height: ['1px', '2px', '1px']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{ top: `${(i + 1) * 5}%` }}
                className="absolute w-full bg-[#0CC0DF]/40"
              />
            ))}
          </div>

          {/* Vertical lines */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`v-${i}`}
                initial={{ opacity: 0.2 }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  width: ['1px', '2px', '1px']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{ left: `${(i + 1) * 5}%` }}
                className="absolute h-full bg-[#0CC0DF]/40"
              />
            ))}
          </div>
        </div>

        <motion.div
          className="w-full relative z-10 px-4 md:px-8 lg:px-16 py-24"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center mb-32">
            <span className="text-white">SIMPLE</span>
            <br className="mb-4" />
            <span className="bg-gradient-to-r from-[#0CC0DF] to-[#14F195] bg-clip-text text-transparent">PRICING PLANS</span>
          </h1>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-3 gap-6'} w-full max-w-6xl mx-auto`}>
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`rounded-xl p-8 ${plan.highlighted ? 'bg-gradient-to-b from-[#0CC0DF]/20 to-transparent border border-[#0CC0DF]/30' : 'bg-white/5'}`}
              >
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                  {plan.name}
                </h2>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-gray-400">/month</span>}
                </div>
                <p className="text-gray-400 mb-8">{plan.description}</p>

                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <FaCheck className="text-[#14F195] flex-shrink-0" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold transition-all duration-200 
                ${plan.highlighted
                    ? 'bg-gradient-to-r from-[#0CC0DF] to-[#14F195] hover:opacity-90'
                    : 'bg-white/10 hover:bg-white/20'}`}>
                  Contact Us
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      <Footer />
    </>
  )
} 