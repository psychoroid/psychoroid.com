import React from 'react'

export default function FullBackgroundText() {
    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black">
            <div
                className="absolute bottom-0 left-0 right-0 flex items-end justify-center overflow-hidden pointer-events-none select-none"
                style={{
                    height: '30vh',
                }}
                aria-hidden="true"
            >
                <div
                    className="text-[15vw] font-extrabold lowercase leading-none"
                    style={{
                        fontSize: 'min(15vw, 20vh)',
                        letterSpacing: '-0.05em',
                        background: 'linear-gradient(45deg, #FF6B6B, #FF8E53, #FFAA3B, #FFD700, #4ECDC4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundSize: '400% 400%',
                        animation: 'gradient 15s ease infinite',
                        transform: 'translateY(20%)',
                    }}
                >
                    psychoroid.com
                </div>
            </div>
            <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
            {/* Your page content would go here */}
            <div className="relative z-10 min-h-screen">
                {/* Content */}
            </div>
        </div>
    )
}

