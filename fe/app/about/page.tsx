'use client'

import Footer from '@/components/Footer'
import NavBar from '@/components/NavBar'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function About() {
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

  const teamMembers = [
    {
      name: "Patrick Ha",
      role: "Saturnors",
      image: "/founder11.jpeg",
      linkedin: "https://x.com/patricksaturnor"
    },
    {
      name: "Roman Lobanov",
      role: "Saturnors",
      image: "/founder2.jpeg",
      linkedin: "https://x.com/ComplexiaSC"
    }
  ]

  return (
    <>
      <NavBar />

      <section className="relative overflow-hidden min-h-screen">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[#0f1c3d]">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#14F195] rounded-full filter blur-[120px] opacity-100" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9945FF] rounded-full filter blur-[120px] opacity-100" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#14F195] rounded-full filter blur-[150px] opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#071A2F]/90 via-[#0A527A]/80 to-[#0CC0DF]/70" />
        </div>

        <motion.div
          className="relative z-10 px-6 py-24 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold my-32 mb-8">
              <span className="text-white">About</span>{' '}
              <span className="bg-gradient-to-r from-[#0CC0DF] to-[#14F195] bg-clip-text text-transparent">
                Our Mission
              </span>
            </h1>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="prose prose-lg prose-invert max-w-none"
          >
            <div className="flex flex-col md:flex-row gap-16 items-center my-48">
              <div className="w-full md:w-1/2">
                <h2 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                  Who We Are
                </h2>
                <p className="text-gray-200">
                  We call ourselves Saturn Labs, in fact we're just a couple of folks who want to do fun things and try to solve real-life problems with blockchain.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative aspect-video">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <div className="flex flex-col items-center justify-center h-full">
                    <Image
                      src="/saturn.jpg"
                      alt="Our Team"
                      fill
                      className="object-cover rounded-xl"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 text-center text-sm text-white">
                      <p className="font-medium">Saturn Labs - Saturn Foundation</p>
                      <p className="text-gray-300">2024 all rights reserved</p>
                      <a
                        href="https://www.saturnlabs.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9945FF] hover:underline"
                      >
                        www.saturnlabs.dev
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-16">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-[#0f1c3d]/50 rounded-xl p-6 backdrop-blur-sm hover:bg-[#0f1c3d]/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#0CC0DF]/20 group"
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover object-center scale-75 group-hover:scale-85 transition-transform duration-300" 
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#0CC0DF] transition-colors">{member.name}</h3>
                  <p className="text-gray-300 mb-4 group-hover:text-white transition-colors">{member.role}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9945FF] hover:text-[#0CC0DF] transition-colors flex items-center gap-2 group-hover:translate-x-2 duration-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Poke me
                  </a>
                </motion.div>
              ))}
            </div>

            <div className="my-48"></div>

            <div className="flex flex-col md:flex-row-reverse gap-16 items-center my-16">
              <div className="w-full md:w-1/2">
                <h2 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                  Our Vision
                </h2>
                <p className="text-gray-200">
                  We believe on-chain gaming is cool. But building on-chain interactions is not. So we created an API service to help developers ship faster, more scalable and cheaper transactions so you can build dope games and enjoy it.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative aspect-[16/12]">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/onchaingame.jpeg"
                    alt="Our Vision"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="my-48"></div>

            <div className="flex flex-col md:flex-row gap-16 items-center my-16">
              <div className="w-full md:w-1/2">
                <h2 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                  Why Now?
                </h2>
                <p className="text-gray-200">
                  MetaLoot was a finalist in the Bangkok EthGlobal Hackathon 2024. Presumably, we think people need this service.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative aspect-[16/12]">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/whynow.jpeg"
                    alt="EthGlobal Hackathon"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="my-48"></div>

            <div className="flex flex-col md:flex-row-reverse gap-16 items-center my-16">
              <div className="w-full md:w-1/2">
                <h2 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                  Why MetaLoot?
                </h2>
                <p className="text-gray-200">
                  We tried three different blockchains, rewrote and scratched our heads numerous times. Finally, we formed a substantial, scalable, and fast solution for you guys to work with.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative aspect-[16/12]">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/whymetaloot.jpeg"
                    alt="Our Solution"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="my-48"></div>

            <div className="flex flex-col md:flex-row gap-16 items-center my-16">
              <div className="w-full md:w-1/2">
                <h2 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-[#0CC0DF] to-[#0CC0DF]/70 bg-clip-text text-transparent">
                  Why Us?
                </h2>
                <p className="text-gray-200">
                  A team of good integration developers with dope expertise. Long-lived and experienced blockchain developers. A cool team that likes nothing more than sitting back and playing cool games. Yeah, we think it's the optimal choice to build games with us.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative aspect-[16/12]">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/whyuss.jpeg"
                    alt="Team Working"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </>
  )
}