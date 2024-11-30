'use client';

import React, { useCallback } from 'react';

interface ImageUploadProps {
  onImageUpload: (image: string) => void;
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <label
          htmlFor="image-upload"
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm text-gray-500">Upload product image</span>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </label>
        <p className="mt-2 text-xs text-gray-500">
          Supported formats: JPG, PNG (max 5MB)
        </p>
      </div>
    </div>
  );
}