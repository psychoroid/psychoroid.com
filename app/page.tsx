'use client'

import { ProductViewer } from '@/components/3D/ProductViewer'
import { ProductControls } from '@/components/3D/ProductControls'
import { ImageUpload } from '@/components/3D/ImageUpload'
import { Navbar } from '@/components/design/Navbar'
import { ImagePreview } from '@/components/3D/ImagePreview'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'

interface UserUpload {
    id: string;
    image_path: string;
    created_at: string;
}

export default function Home() {
    const [isRotating, setIsRotating] = useState(true)
    const [uploadedImages, setUploadedImages] = useState<string[]>([])
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const { user } = useUser()

    useEffect(() => {
        const cachedImages = localStorage.getItem('cachedImages')
        const cachedSelectedImage = localStorage.getItem('cachedSelectedImage')

        if (cachedImages) {
            setUploadedImages(JSON.parse(cachedImages))
        }
        if (cachedSelectedImage) {
            setSelectedImage(cachedSelectedImage)
        }
    }, [])

    useEffect(() => {
        async function fetchUserUploads() {
            if (!user) return

            const { data: uploads, error } = await supabase
                .rpc('get_user_uploads', {
                    p_user_id: user.id
                }) as { data: UserUpload[] | null, error: any }

            if (error) {
                console.error('Error fetching uploads:', error)
                return
            }

            if (uploads) {
                const imagePaths = uploads.map(upload => upload.image_path)
                setUploadedImages(imagePaths)
                localStorage.setItem('cachedImages', JSON.stringify(imagePaths))

                if (!selectedImage && imagePaths.length > 0) {
                    setSelectedImage(imagePaths[0])
                    localStorage.setItem('cachedSelectedImage', imagePaths[0])
                }
            }
        }

        fetchUserUploads()
    }, [user])

    const handleImageUpload = (imagePath: string) => {
        setUploadedImages(prev => [...prev, imagePath])
        if (!selectedImage) {
            setSelectedImage(imagePath)
        }
    }

    const handleImageRemove = (imagePath: string) => {
        setUploadedImages(prev => prev.filter(img => img !== imagePath))
        if (selectedImage === imagePath) {
            setSelectedImage(uploadedImages[0] || null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">
            <Navbar />
            <div className="p-8 pt-24">
                <div className="max-w-7xl mx-auto text-gray-900 dark:text-white">
                    <ImageUpload
                        onImageUpload={handleImageUpload}
                    />

                    {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-10 gap-8 mt-8">
                            {/* Left Panel - 2D Preview */}
                            <div className="rounded-lg p-6 shadow-sm col-span-3 border dark:border-gray-300 border-gray-200 bg-transparent overflow-hidden">
                                <ImagePreview
                                    imagePaths={uploadedImages}
                                    selectedImage={selectedImage}
                                    onImageClick={setSelectedImage}
                                    onImageRemove={handleImageRemove}
                                    currentPage={page}
                                    onPageChange={setPage}
                                />
                            </div>

                            {/* Right Panel - 3D Viewer */}
                            <div className="rounded-lg p-6 shadow-sm col-span-7 border dark:border-gray-300 border-gray-200 bg-transparent">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">3D Preview</h2>
                                <div className="relative h-96">
                                    <ProductViewer
                                        imagePath={selectedImage || ''}
                                        isRotating={isRotating}
                                    />
                                    <ProductControls
                                        isRotating={isRotating}
                                        onRotateToggle={() => setIsRotating(!isRotating)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 