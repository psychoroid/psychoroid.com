import React, { useState } from 'react';
import { ProductViewer } from './components/ProductViewer';
import { ProductControls } from './components/ProductControls';
import { ImageUpload } from './components/ImageUpload';

export default function App() {
  const [isRotating, setIsRotating] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string>();
  const [productText, setProductText] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">3D Product Viewer</h1>

        <div className="mb-8">
          <ImageUpload onImageUpload={setUploadedImage} />
        </div>

        <div className="relative">
          <ProductViewer imageUrl={uploadedImage} />
          <ProductControls
            isRotating={isRotating}
            onRotateToggle={() => setIsRotating(!isRotating)}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Upload a product image using the upload area above</li>
            <li>The image will be mapped onto a 3D cube</li>
            <li>Use your mouse to interact with the 3D model:</li>
            <li className="ml-6">Left click and drag to rotate manually</li>
            <li className="ml-6">Right click and drag to pan</li>
            <li className="ml-6">Scroll to zoom in/out</li>
          </ul>
        </div>
      </div>
    </div>
  );
}