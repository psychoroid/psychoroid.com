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
                        d="M44 367V1075.5H173V367H339C459.5 367 522 460.5 522 573C522 685.5 459.5 779 339 779H173V1075.5
                        M173 487H339C395.5 487 413 530 413 573C413 616 395.5 659 339 659H173V487
                        M44 267V367V1075.5H173V879H339C509.5 879 622 735.5 622 573C622 410.5 509.5 267 339 267H134H44Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="0.2"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated P */}
                    <motion.path
                        d="M44 367V1075.5H173V367H339C459.5 367 522 460.5 522 573C522 685.5 459.5 779 339 779H173V1075.5
                        M173 487H339C395.5 487 413 530 413 573C413 616 395.5 659 339 659H173V487
                        M44 267V367V1075.5H173V879H339C509.5 879 622 735.5 622 573C622 410.5 509.5 267 339 267H134H44Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="1"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                        {...animations.p}
                    />

                    {/* Static 0 */}
                    <path
                        d="M731.5 182.5H1153L852 478V69C852 69 1032.5 69 1153 69C1273.5 69 1360 182.5 1360 275C1360 367.5 1360 563.5 1360 563.5H946.5L1240 275V677.5C1240 677.5 1076 677.5 946.5 677.5C817 677.5 731.5 555 731.5 478C731.5 401 731.5 182.5 731.5 182.5Z"
                        stroke="#FF1744"
                        strokeWidth="3"
                        strokeOpacity="0.2"
                        filter="url(#glow)"
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Animated 0 */}
                    <motion.path
                        d="M731.5 182.5H1153L852 478V69C852 69 1032.5 69 1153 69C1273.5 69 1360 182.5 1360 275C1360 367.5 1360 563.5 1360 563.5H946.5L1240 275V677.5C1240 677.5 1076 677.5 946.5 677.5C817 677.5 731.5 555 731.5 478C731.5 401 731.5 182.5 731.5 182.5Z"
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
