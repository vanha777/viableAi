'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Partner() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Founder, SupplyChainX",
      quote: "ConvictionAI helped me validate my supply chain optimization idea before writing a single line of code. The evidence it helped me gather convinced my first investors.",
      image: "/founder2.jpeg"
    },
    {
      name: "Michael Rodriguez",
      role: "Founder, HealthTech Solutions",
      quote: "I was about to build an app nobody wanted. ConvictionAI forced me to focus on real customer pain points and build evidence for my solution first.",
      image: "/patrick.jpeg"
    },
    {
      name: "Aisha Patel",
      role: "Founder, EduLearn",
      quote: "The focused direction ConvictionAI provided helped me channel my energy into validating my edtech idea with real teachers before spending resources on development.",
      image: "/founder3.jpeg"
    },
    {
      name: "David Kim",
      role: "Founder, ClimateTech",
      quote: "ConvictionAI helped me build unwavering belief in my sustainability platform by focusing on evidence and validation first. It changed my entire approach to building.",
      image: "/founder4.jpeg"
    }
  ]

  return (
    <section className="bg-black via-gray-800 to-gray-900 relative overflow-hidden py-24">
      {/* Background blurs similar to footer */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#E0FF00] rounded-full filter blur-[120px] opacity-10" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#E0FF00] rounded-full filter blur-[120px] opacity-10" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-[#E0FF00]">
              Founders Who Built With Conviction
            </span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            See how founders used ConvictionAI to validate their ideas and build unwavering belief in their vision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                  <div>
                    <h3 className="font-medium text-[#E0FF00]">{testimonial.name}</h3>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="font-bold text-xl text-gray-200 mb-6">
            Join 1,000+ founders building with conviction
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-[#E0FF00] text-gray-900 font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Building Conviction
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}