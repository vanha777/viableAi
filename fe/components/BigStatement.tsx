'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function BigStatement() {
    return (
        <div className="hero min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            {/* Abstract background elements */}
            <div className="absolute inset-0">
                {/* Gradient mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                
                {/* Glowing orbs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500 rounded-full filter blur-[120px] opacity-10" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full filter blur-[120px] opacity-10" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-400 rounded-full filter blur-[150px] opacity-10" />

                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[url('/grid.png')] opacity-20"
                    style={{ backgroundSize: '50px 50px' }} />
            </div>
            
            <div className="hero-content relative z-10">
                <div className="flex flex-col items-center gap-16">
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center mt-32 mb-32">
                        <span className="text-white">DEVELOPER DASHBOARD</span>
                        <br className="mb-4"/>
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">FOR BETTER DECISIONS</span>
                    </h1>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                            duration: 0.5,
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                        }}
                        className="relative w-full max-w-4xl mx-auto"
                    >
                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-white/10">
                            <Image
                                src="/apiDashboard.png"
                                alt="API Dashboard"
                                width={1200}
                                height={800}
                                className="w-full h-auto rounded-xl"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
