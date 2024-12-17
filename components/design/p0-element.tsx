'use client'

import React, { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

const P0Element: React.FC = memo(() => {
    const animations = useMemo(() => ({
        p: {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: {
                duration: 29,
                repeat: 2,
                repeatType: "loop" as const,
                ease: "linear",
                repeatDelay: 0
            }
        },
        zero: {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: {
                duration: 12,
                repeat: 2,
                repeatType: "loop" as const,
                ease: "linear",
                repeatDelay: 17
            }
        }
    }), []);

    const svgProps = useMemo(() => ({
        width: "100%",
        height: "100%",
        viewBox: "-50 0 1500 1100",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.6)',
            opacity: 0.8,
            willChange: 'transform',
            backfaceVisibility: 'hidden'
        } as React.CSSProperties
    }), []);

    return (
        <div className="w-full h-full bg-transparent">
            <svg {...svgProps}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g>
                    {/* Static P */}
                    <path
                        d="M44 361V1069.5H173V361H339C459.5 361 522 454.5 522 567C522 679.5 459.5 773 339 773H173V1069.5
                        M173 481H339C395.5 481 413 524 413 567C413 610 395.5 653 339 653H173V481
                        M44 261V361V1069.5H173V873H339C509.5 873 622 729.5 622 567C622 404.5 509.5 261 339 261H134H44Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="0.2"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated P */}
                    <motion.path
                        d="M44 361V1069.5H173V361H339C459.5 361 522 454.5 522 567C522 679.5 459.5 773 339 773H173V1069.5
                        M173 481H339C395.5 481 413 524 413 567C413 610 395.5 653 339 653H173V481
                        M44 261V361V1069.5H173V873H339C509.5 873 622 729.5 622 567C622 404.5 509.5 261 339 261H134H44Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="1"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                        {...animations.p}
                    />

                    {/* Static 0 */}
                    <path
                        d="M731.5 174.5H1153L852 470V61C852 61 1032.5 61 1153 61C1273.5 61 1360 174.5 1360 267C1360 359.5 1360 555.5 1360 555.5H946.5L1240 267V669.5C1240 669.5 1076 669.5 946.5 669.5C817 669.5 731.5 547 731.5 470C731.5 393 731.5 174.5 731.5 174.5Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="0.2"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated 0 */}
                    <motion.path
                        d="M731.5 174.5H1153L852 470V61C852 61 1032.5 61 1153 61C1273.5 61 1360 174.5 1360 267C1360 359.5 1360 555.5 1360 555.5H946.5L1240 267V669.5C1240 669.5 1076 669.5 946.5 669.5C817 669.5 731.5 547 731.5 470C731.5 393 731.5 174.5 731.5 174.5Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="1"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                        {...animations.zero}
                    />
                </g>
            </svg>
        </div>
    )
});

P0Element.displayName = 'P0Element';

export default P0Element
