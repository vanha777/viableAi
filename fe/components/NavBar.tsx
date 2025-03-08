'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function NavBar() {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="top-0 w-full z-50"
        >
            {/* Background with dark theme */}
            <div className="absolute inset-0 bg-transparent">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-black" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold tracking-tight text-[#E0FF00] drop-shadow-sm hover:scale-105 transition-transform flex items-center">
                            <div className="mr-2 w-8 h-8 rounded-md bg-[#E0FF00] flex items-center justify-center text-gray-900 text-xs">
                                AI
                            </div>
                            Conviction<span className="text-3xl">AI</span>
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <span className="text-xl font-serif italic text-[#E0FF00] font-medium">
                            Don't skip the "V" in "MVP"
                        </span>
                        {/* <Link href="#features" className="text-gray-300 hover:text-[#E0FF00] transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-gray-300 hover:text-[#E0FF00] transition-colors">
                            How It Works
                        </Link>
                        <Link href="#pricing" className="text-gray-300 hover:text-[#E0FF00] transition-colors">
                            Pricing
                        </Link> */}
                    </div>

                    {/* CTA Button */}
                    <div>
                        <Link
                            href="/dashboard"
                            className="bg-[#E0FF00] text-gray-900 px-6 py-2 rounded-lg font-medium 
                            hover:bg-[#E0FF00]/90 transition-all duration-300 
                            border border-[#E0FF00]/20 shadow-md shadow-[#E0FF00]/10"
                        >
                            Claim Your Spot
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}