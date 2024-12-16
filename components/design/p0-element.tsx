'use client'

import React from 'react'
import { motion } from 'framer-motion'

const P0Element: React.FC = () => {
    return (
        <div className="w-full h-full bg-transparent">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1283 825"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) scale(0.6)',
                    opacity: 0.8
                }}
            >
                <defs>
                    <radialGradient id="fadeGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#FF1744" stopOpacity="1" />
                        <stop offset="100%" stopColor="black" stopOpacity="1" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <mask id="vignette">
                        <rect fill="url(#fadeGradient)" height="825" width="1283" x="0" y="0" />
                    </mask>
                    <mask id="p-clip">
                        <path d="M2 201V809.5H166.5V201H347C467.5 201 554 314.5 554 407C554 499.5 467.5 613 347 613H166.5V809.5M166.5 613V321H347C407.5 321 454 364 454 407C454 450 407.5 493 347 493H166.5V613" stroke="white" vectorEffect="non-scaling-stroke" />
                    </mask>
                    <mask id="o-clip">
                        <path d="M653.5 114.5H1075L774 410V1C774 1 954.5 1 1075 1C1195.5 1 1282 114.5 1282 207C1282 299.5 1282 495.5 1282 495.5H868.5L1162 207V609.5C1162 609.5 998 609.5 868.5 609.5C739 609.5 653.5 487 653.5 410C653.5 333 653.5 114.5 653.5 114.5Z" stroke="white" vectorEffect="non-scaling-stroke" />
                    </mask>
                </defs>

                <g mask="url(#vignette)">
                    <g transform="translate(0, 25)">
                        {/* Static P - single continuous path with matched inner and outer curves */}
                        <path
                            d="M72 201H201V909.5H72V201Z M201 201H367C487.5 201 550 294.5 550 407C550 519.5 487.5 613 367 613H201V321H367C423.5 321 441 364 441 407C441 450 423.5 493 367 493H201V909.5"
                            stroke="#FF1744"
                            strokeWidth="3"
                            strokeOpacity="0.2"
                            filter="url(#glow)"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Animated P - single continuous path with matched inner and outer curves */}
                        <motion.path
                            d="M72 201H201V909.5H72V201Z M201 201H367C487.5 201 550 294.5 550 407C550 519.5 487.5 613 367 613H201V321H367C423.5 321 441 364 441 407C441 450 423.5 493 367 493H201V909.5"
                            stroke="#FF1744"
                            strokeWidth="3"
                            strokeOpacity="1"
                            filter="url(#glow)"
                            vectorEffect="non-scaling-stroke"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: [0, 1, 2] }}
                            transition={{
                                duration: 30,
                                repeat: Infinity,
                                repeatType: 'loop',
                                ease: "linear",
                                times: [0, 0.5, 1]
                            }}
                        />
                    </g>
                    {/* Static 0 */}
                    <path
                        d="M583.5 114.5H1005L704 410V1C704 1 884.5 1 1005 1C1125.5 1 1212 114.5 1212 207C1212 299.5 1212 495.5 1212 495.5H798.5L1092 207V609.5C1092 609.5 928 609.5 798.5 609.5C669 609.5 583.5 487 583.5 410C583.5 333 583.5 114.5 583.5 114.5Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="0.2"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated 0 */}
                    <motion.path
                        d="M583.5 114.5H1005L704 410V1C704 1 884.5 1 1005 1C1125.5 1 1212 114.5 1212 207C1212 299.5 1212 495.5 1212 495.5H798.5L1092 207V609.5C1092 609.5 928 609.5 798.5 609.5C669 609.5 583.5 487 583.5 410C583.5 333 583.5 114.5 583.5 114.5Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="1"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1, 2] }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: "linear",
                            times: [0, 0.5, 1]
                        }}
                    />
                </g>
            </svg>
        </div>
    )
}

export default P0Element
