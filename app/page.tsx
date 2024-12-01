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
                </div>
            </div>
        </div>
    )
} 