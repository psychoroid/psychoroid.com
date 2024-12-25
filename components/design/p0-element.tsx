'use client'

import React, { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = [
    '#FF5252', // Red psychoroid
    '#3B82F6', // Blue
    '#08CFCE', // Cyber
    // '#FEB60A', // Gold
    '#98D8C8', // Mint
];

const P0Element: React.FC = memo(() => {
    const selectedColor = useMemo(() => {
        // Use session storage to maintain color during session
        const storedColor = sessionStorage.getItem('p0ElementColor');
        if (storedColor) return storedColor;

        // Select random color if none stored
        const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        sessionStorage.setItem('p0ElementColor', newColor);
        return newColor;
    }, []);

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
        viewBox: "-50 -15 1500 1100",
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
                        d="M44 317V1025.5H173V317H339C459.5 317 522 410.5 522 523C522 635.5 459.5 729 339 729H173V1025.5
                        M173 437H339C395.5 437 413 480 413 523C413 566 395.5 609 339 609H173V437
                        M44 217V317V1025.5H173V829H339C509.5 829 622 685.5 622 523C622 360.5 509.5 217 339 217H134H44Z"
                        stroke={selectedColor}
                        strokeWidth="2"
                        strokeOpacity="0.15"
                        strokeDasharray="3,8"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated P */}
                    <motion.path
                        d="M44 317V1025.5H173V317H339C459.5 317 522 410.5 522 523C522 635.5 459.5 729 339 729H173V1025.5
                        M173 437H339C395.5 437 413 480 413 523C413 566 395.5 609 339 609H173V437
                        M44 217V317V1025.5H173V829H339C509.5 829 622 685.5 622 523C622 360.5 509.5 217 339 217H134H44Z"
                        stroke={selectedColor}
                        strokeWidth="2"
                        strokeOpacity="0.8"
                        strokeDasharray="3,8"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                        {...animations.p}
                    />

                    {/* Static 0 */}
                    <path
                        d="M731.5 132.5H1153L852 428V19C852 19 1032.5 19 1153 19C1273.5 19 1360 132.5 1360 225C1360 317.5 1360 513.5 1360 513.5H946.5L1240 225V627.5C1240 627.5 1076 627.5 946.5 627.5C817 627.5 731.5 505 731.5 428C731.5 351 731.5 132.5 731.5 132.5Z"
                        stroke={selectedColor}
                        strokeWidth="2"
                        strokeOpacity="0.15"
                        strokeDasharray="3,8"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated 0 */}
                    <motion.path
                        d="M731.5 132.5H1153L852 428V19C852 19 1032.5 19 1153 19C1273.5 19 1360 132.5 1360 225C1360 317.5 1360 513.5 1360 513.5H946.5L1240 225V627.5C1240 627.5 1076 627.5 946.5 627.5C817 627.5 731.5 505 731.5 428C731.5 351 731.5 132.5 731.5 132.5Z"
                        stroke={selectedColor}
                        strokeWidth="2"
                        strokeOpacity="0.8"
                        strokeDasharray="3,8"
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
