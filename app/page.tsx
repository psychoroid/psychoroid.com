'use client'

import { ProductViewer } from '@/components/3D/ProductViewer'
import { ProductControls } from '@/components/3D/ProductControls'
import { ImageUpload } from '@/components/3D/ImageUpload'
import { Navbar } from '@/components/design/Navbar'
import { ImagePreview } from '@/components/3D/ImagePreview'
import { useState } from 'react'

export default function Home() {
    const [isRotating, setIsRotating] = useState(true)
    const [uploadedImagePath, setUploadedImagePath] = useState<string>('')

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">
            <Navbar />
            <div className="p-8 pt-24">
                <div className="max-w-4xl mx-auto text-gray-900 dark:text-white">
                    <h1 className="text-3xl font-bold mb-8">3D Product Viewer</h1>

                    <div className="mb-8">
                        <ImageUpload onImageUpload={setUploadedImagePath} />
                    </div>

                    {uploadedImagePath && (
                        <ImagePreview imagePath={uploadedImagePath} />
                    )}

                    <div className="relative">
                        <ProductViewer
                            imagePath={uploadedImagePath}
                            isRotating={isRotating}
                        />
                        <ProductControls
                            isRotating={isRotating}
                            onRotateToggle={() => setIsRotating(!isRotating)}
                        />
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                        <ul className="list-disc list-inside text-gray-400 space-y-2">
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
        </div>
    )
} 