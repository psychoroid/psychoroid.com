'use client';

import React from 'react';
import { Button } from "@/components/ui/button"
import { PlayCircle, PauseCircle, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface ProductControlsProps {
  isRotating: boolean;
  onRotateToggle: () => void;
}

export function ProductControls({ isRotating, onRotateToggle }: ProductControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      <Button
        onClick={onRotateToggle}
        variant="outline"
        size="icon"
        className="bg-white/80 hover:bg-white transition-colors duration-200"
      >
        {isRotating ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/80 hover:bg-white transition-colors duration-200"
      >
        <RotateCcw className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/80 hover:bg-white transition-colors duration-200"
      >
        <ZoomIn className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/80 hover:bg-white transition-colors duration-200"
      >
        <ZoomOut className="h-6 w-6" />
      </Button>
    </div>
  );
}

