'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
// import Link from 'next/link'

export default function WhatNew() {
  const projects = [
    {
      title: "MetaLoot Launch Pad",
      image: "/launchPad.jpeg",
      link: "https://www.metaloot.app/"
    },
    {
      title: "MetaLoot SDK", 
      image: "/comingSoon.png",
      link: "/"
    },
    {
      title: "Analytics Dashboard",
      image: "/comingSoon.png",
      link: "/"
    },
    {
      title: "Community Hub",
      image: "/comingSoon.png", 
      link: "/"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <section className="min-h-screen relative overflow-hidden py-24">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50" />
      
      {/* Subtle decorative blurs */}
      <div className="absolute top-20 -right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center mt-32 mb-10">
            <span className="text-gray-800">WHAT'S</span>{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NEW</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the latest updates about MetaLoot, our projects and development progress. Stay informed about new features and improvements.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {projects.map((project, index) => (
            <a href={project.link} target="_blank" rel="noopener noreferrer" key={index}>
              <motion.div
                variants={itemVariants}
                className="relative group bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 border border-gray-100"
              >
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <h3 className="text-2xl font-bold text-white">{project.title}</h3>
                      <div className="mt-2 text-blue-400 font-medium">Learn More →</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}