'use client';

import React from 'react';

interface ProductControlsProps {
  onRotateToggle: () => void;
  isRotating: boolean;
}

export function ProductControls({ onRotateToggle, isRotating }: ProductControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
      <button
        onClick={onRotateToggle}
        className={`px-4 py-2 rounded-lg transition-colors ${isRotating
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
      >
        {isRotating ? '⏹ Stop Rotation' : '▶ Start Rotation'}
      </button>
    </div>
  );
}