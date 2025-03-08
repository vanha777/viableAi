'use client'

import { motion } from 'framer-motion'
import { FaEnvelope, FaDiscord, FaXTwitter } from 'react-icons/fa6'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import NavBar from '@/components/NavBar'

export default function Contact() {
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

  const contactMethods = [
    {
      title: "Email Us",
      description: "Have a question? Send us an email and we'll get back to you within 24 hours.",
      icon: FaEnvelope,
      action: "patrick@saturnlabs.dev",
      buttonText: "Send Email"
    },
    {
      title: "Join Discord",
      description: "Join our community on Discord for real-time support and discussions.",
      icon: FaDiscord,
      action: "https://discord.gg/U7WJBdCtjv",
      buttonText: "Join Server"
    },
    {
      title: "Follow on Twitter",
      description: "Follow us on Twitter for the latest updates and announcements.",
      icon: FaXTwitter,
      action: "https://x.com/playmetaloot",
      buttonText: "Follow Us"
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
          className="w-full relative z-10 px-4 md:px-8 lg:px-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center mb-32 mt-32">
            <span className="text-white">GET IN </span>
            <span className="bg-gradient-to-r from-[#0CC0DF] to-[#14F195] bg-clip-text text-transparent">TOUCH</span>
          </h1>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-8'} w-full max-w-6xl mx-auto`}>
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-center items-center w-24 h-24 mx-auto rounded-full bg-[#0CC0DF]/10">
                  <method.icon className="w-12 h-12 text-[#0CC0DF]" />
                </div>

                <div className="text-center">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                    {method.title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-200 leading-relaxed mb-4">
                    {method.description}
                  </p>
                  <a
                    href={method.title === "Email Us" ? `mailto:${method.action}` : method.action}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#0CC0DF] to-[#14F195] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    {method.buttonText}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      <Footer />
    </>
  )
} 