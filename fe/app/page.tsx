'use client'

import { useState, useEffect, Suspense } from 'react'
import Satements from '@/components/statements'
import BigStatement from '@/components/BigStatement'
import Hero2 from '@/components/Hero2'
import Demo from '@/components/Demo'
import Features from '@/components/Features'
import NavBar from '@/components/NavBar'
import Partner from '@/components/Partner'
import Starters from '@/components/Starters'
import WhatNew from '@/components/whatNew'
import Footer from '@/components/Footer'
import Landing from '@/components/Landing'
import Head from 'next/head'

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Suspense fallback={<div className="bg-black text-gray-200">Loading...</div>}>
      <main className="bg-black min-h-screen relative text-gray-200">
        <title>ConvictionAI - Build Founder Conviction Before Code</title>
        {/* Solana Stamp */}
        <div className="fixed left-4 bottom-4 bg-gradient-to-r from-[#E0FF00] to-[#E0FF00] p-[1px] rounded-lg rotate-[-4deg] shadow-lg hover:rotate-0 transition-all duration-300 z-50">
          <div className="bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E0FF00] to-[#E0FF00] font-bold">
                Alpha Release: Only 5 Founder Spots!
              </span>
            </div>
          </div>
        </div>
        <NavBar />
        <Landing />
        {/* <Features /> */}
        <Partner />
        {/* <Starters /> */}
        <Footer />
      </main>
    </Suspense>
  )
}