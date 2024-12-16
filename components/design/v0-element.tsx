'use client'

import React from 'react'
import { motion } from 'framer-motion'

const V0Element: React.FC = () => {
    return (
        <div className="w-full h-full bg-transparent">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1283 610"
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
                        <stop offset="0%" stopColor="#D73D57" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="black" stopOpacity="1" />
                    </radialGradient>
                    <mask id="vignette">
                        <rect fill="url(#fadeGradient)" height="610" width="1283" x="0" y="0" />
                    </mask>
                    <mask id="v-clip">
                        <path d="M184.5 114.5H2C154.667 262.5 458 556.385 494 591C530 625.615 612.5 613 612.5 541.5V114.5H485.5V406L184.5 114.5Z" stroke="white" vectorEffect="non-scaling-stroke" />
                    </mask>
                    <mask id="o-clip">
                        <path d="M653.5 114.5H1075L774 410V1C774 1 954.5 1 1075 1C1195.5 1 1282 114.5 1282 207C1282 299.5 1282 495.5 1282 495.5H868.5L1162 207V609.5C1162 609.5 998 609.5 868.5 609.5C739 609.5 653.5 487 653.5 410C653.5 333 653.5 114.5 653.5 114.5Z" stroke="white" vectorEffect="non-scaling-stroke" />
                    </mask>
                </defs>

                <g mask="url(#vignette)">
                    <path
                        d="M184.5 114.5H2C154.667 262.5 458 556.385 494 591C530 625.615 612.5 613 612.5 541.5V114.5H485.5V406L184.5 114.5Z"
                        stroke="#D73D57"
                        strokeWidth="3"
                        strokeOpacity="0.1"
                        vectorEffect="non-scaling-stroke"
                    />
                    <motion.path
                        d="M184.5 114.5H2C154.667 262.5 458 556.385 494 591C530 625.615 612.5 613 612.5 541.5V114.5H485.5V406L184.5 114.5Z"
                        stroke="#D73D57"
                        strokeWidth="3"
                        strokeOpacity="0.8"
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
                    <path
                        d="M653.5 114.5H1075L774 410V1C774 1 954.5 1 1075 1C1195.5 1 1282 114.5 1282 207C1282 299.5 1282 495.5 1282 495.5H868.5L1162 207V609.5C1162 609.5 998 609.5 868.5 609.5C739 609.5 653.5 487 653.5 410C653.5 333 653.5 114.5 653.5 114.5Z"
                        stroke="#D73D57"
                        strokeWidth="3"
                        strokeOpacity="0.1"
                        vectorEffect="non-scaling-stroke"
                    />
                    <motion.path
                        d="M653.5 114.5H1075L774 410V1C774 1 954.5 1 1075 1C1195.5 1 1282 114.5 1282 207C1282 299.5 1282 495.5 1282 495.5H868.5L1162 207V609.5C1162 609.5 998 609.5 868.5 609.5C739 609.5 653.5 487 653.5 410C653.5 333 653.5 114.5 653.5 114.5Z"
                        stroke="#D73D57"
                        strokeWidth="3"
                        strokeOpacity="0.8"
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

export default V0Element
