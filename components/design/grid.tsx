'use client'

import React from 'react'

export default function SubtleGrid() {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-black"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  )
}

