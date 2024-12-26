'use client';

import React from 'react';
import { Button } from "@/components/ui/button"
import { PlayCircle, PauseCircle, ZoomIn, ZoomOut, Expand, Download, Crosshair, Focus } from 'lucide-react'
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
  isZoomToCursor = false,
  onZoomModeToggle,
}: ProductControlsProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Button
        onClick={onRotateToggle}
        variant="outline"
        size="icon"
        className="rounded-none border-2 bg-black/5 text-gray-800 hover:bg-black/10 hover:text-gray-900 hover:border-black/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
      >
        {isRotating ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
      </Button>
      <Button
        onClick={onZoomIn}
        variant="outline"
        size="icon"
        className="rounded-none border-2 bg-black/5 text-gray-800 hover:bg-black/10 hover:text-gray-900 hover:border-black/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
      >
        <ZoomIn className="h-6 w-6" />
      </Button>
      <Button
        onClick={onZoomOut}
        variant="outline"
        size="icon"
        className="rounded-none border-2 bg-black/5 text-gray-800 hover:bg-black/10 hover:text-gray-900 hover:border-black/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
      >
        <ZoomOut className="h-6 w-6" />
      </Button>
      {!hideExpand && (
        <Button
          onClick={onExpand}
          variant="outline"
          size="icon"
          className="rounded-none border-2 bg-black/5 text-gray-800 hover:bg-black/10 hover:text-gray-900 hover:border-black/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          <Expand className="h-6 w-6" />
        </Button>
      )}
      <Button
        onClick={onZoomModeToggle}
        variant="outline"
        size="icon"
        className="rounded-none border-2 bg-black/5 text-gray-800 hover:bg-black/10 hover:text-gray-900 hover:border-black/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        title={isZoomToCursor ? "Cursor Zoom Mode" : "Center Zoom Mode"}
      >
        {isZoomToCursor ? <Crosshair className="h-6 w-6" /> : <Focus className="h-6 w-6" />}
      </Button>
      {!hideDownload && onDownload && (
        <Button
          onClick={onDownload}
          variant="outline"
          size="icon"
          className="rounded-none border-2 bg-black/5 text-gray-800 hover:bg-black/10 hover:text-gray-900 hover:border-black/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          <Download className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

