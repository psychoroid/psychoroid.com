'use client';

import React from 'react';
import { Button } from "@/components/ui/button"
import { PlayCircle, PauseCircle, ZoomIn, ZoomOut, Expand, Download } from 'lucide-react'
import { ProductControlsProps } from '@/types/components';

export function ProductControls({
  isRotating,
  onRotateToggle,
  onZoomIn,
  onZoomOut,
  onExpand,
  onDownload,
  hideExpand = false,
  hideDownload = false,
}: ProductControlsProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Button
        onClick={onRotateToggle}
        variant="outline"
        size="icon"
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        {isRotating ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
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
      {!hideExpand && (
        <Button
          onClick={onExpand}
          variant="outline"
          size="icon"
          className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Expand className="h-6 w-6" />
        </Button>
      )}
      {!hideDownload && onDownload && (
        <Button
          onClick={onDownload}
          variant="outline"
          size="icon"
          className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Download className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

