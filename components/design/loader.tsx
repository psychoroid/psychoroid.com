'use client'

export default function Loader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="animate-spin"
            >
                {[...Array(8)].map((_, i) => (
                    <line
                        key={i}
                        x1="12"
                        y1="3"
                        x2="12"
                        y2="7"
                        className="stroke-foreground"
                        style={{
                            opacity: Math.max(0.2, 1 - (i * 0.1))
                        }}
                        strokeWidth="2"
                        strokeLinecap="round"
                        transform={`rotate(${i * 45} 12 12)`}
                    />
                ))}
            </svg>
        </div>
    )
}

