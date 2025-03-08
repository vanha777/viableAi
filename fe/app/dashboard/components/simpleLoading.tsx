'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function SimpleLoading() {
    const [opacity, setOpacity] = useState(1)

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-fuchsia-50 flex flex-col items-center justify-center gap-8"
            style={{ opacity: opacity }}>
            <motion.div
                className="relative w-32 h-32"
                animate={{
                    rotate: 360
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-sky-300/50" />
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-sky-500 to-fuchsia-500 border-t-transparent"
                    style={{
                        filter: "drop-shadow(0 0 8px rgba(14, 165, 233, 0.6))"
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8],
                        rotate: 360
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute inset-2 rounded-full border-4 border-fuchsia-400/50 border-t-transparent"
                    animate={{
                        rotate: -360
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        className="w-16 h-16 bg-gradient-to-r from-sky-300/30 to-fuchsia-300/30 rounded-full"
                        style={{
                            boxShadow: "0 0 20px rgba(236, 72, 153, 0.4)"
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </motion.div>
        </div>
    )
}