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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {isRotating ? 'Stop Rotation' : 'Start Rotation'}
      </button>
    </div>
  );
}