'use client';

import React from 'react';
import { Button } from "@/components/ui/button"
import { PlayCircle, PauseCircle, RotateCcw, ZoomIn, ZoomOut, Expand } from 'lucide-react'
import { ProductControlsProps } from '@/types/components';

export function ProductControls({
  isRotating,
  onRotateToggle,
  onReset,
  onZoomIn,
  onZoomOut,
  onExpand,
}: ProductControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      <Button
        onClick={onRotateToggle}
        variant="outline"
        size="icon"
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        {isRotating ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="icon"
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <RotateCcw className="h-6 w-6" />
      </Button>
      <Button
        onClick={onZoomIn}
        variant="outline"
        size="icon"
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <ZoomIn className="h-6 w-6" />
      </Button>
      <Button
        onClick={onZoomOut}
        variant="outline"
        size="icon"
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <ZoomOut className="h-6 w-6" />
      </Button>
      <Button
        onClick={onExpand}
        variant="outline"
        size="icon"
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <Expand className="h-6 w-6" />
      </Button>
    </div>
  );
}

