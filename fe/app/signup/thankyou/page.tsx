'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
const ThankYou = () => {
    const router = useRouter();

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-black">
            <div className="text-center space-y-8">
                {/* Logo Circle with Glow Effect */}
                <div className="relative">
                    <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full 
                        flex items-center justify-center relative z-10">
                        <img
                            src="/transLogo.png"
                            alt="MetaLoot Logo"
                            className="w-20 h-20"
                        />
                    </div>
                    {/* Glowing effect behind the circle */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 
                        blur-xl rounded-full transform scale-150 -z-0"></div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-white text-5xl font-light tracking-wider">Welcome!</h1>
                    <p className="text-white/60 text-xl">Your account has been created successfully</p>
                    <p className="text-white/40 text-sm">
                        Beta version is available for free. We will notify you when it's ready.
                    </p>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-3 bg-black/50 border border-white/10 rounded-lg
                     text-white/60 hover:text-white hover:border-white/30 
                     transition-all duration-300"
                    >
                        Go to HomePage
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThankYou;
