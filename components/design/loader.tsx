'use client'

import { useTheme } from 'next-themes'

export default function Spinner() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                className="animate-spin"
            >
                {[...Array(12)].map((_, i) => (
                    <line
                        key={i}
                        x1="20"
                        y1="4"
                        x2="20"
                        y2="12"
                        className="stroke-foreground"
                        style={{
                            opacity: Math.max(0.1, 1 - (i * 0.08))
                        }}
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform={`rotate(${i * 30} 20 20)`}
                    />
                ))}
            </svg>
        </div>
    )
}

