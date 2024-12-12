'use client'

import { ProductViewer } from '@/components/3D/ProductViewer'
import { ProductControls } from '@/components/3D/ProductControls'
import { ImageUpload } from '@/components/3D/ImageUpload'
import { Navbar } from '@/components/design/Navbar'
import { ImagePreview } from '@/components/3D/ImagePreview'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { useUser } from '@/lib/contexts/UserContext'
import { UserUpload } from '@/types/product'
import { Footer } from '@/components/design/Footer'

export default function Home() {
    const [isRotating, setIsRotating] = useState(true)
    const [uploadedImages, setUploadedImages] = useState<string[]>([])
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [modelUrl, setModelUrl] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [zoom, setZoom] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUser()
    const [processingImages, setProcessingImages] = useState<{ [key: string]: number }>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('processingImages');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

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
        localStorage.setItem('processingImages', JSON.stringify(processingImages))
    }, [processingImages])

    useEffect(() => {
        let isMounted = true

        async function fetchUserUploads() {
            if (!user) return

            try {
                const { data: uploads, error } = await supabase
                    .rpc('get_user_uploads', {
                        p_user_id: user.id
                    }) as { data: UserUpload[] | null, error: any }

                if (!isMounted || error) {
                    if (error) console.error('Error fetching uploads:', error)
                    return
                }

                if (uploads?.length) {
                    const imagePaths = uploads.map(upload => upload.image_path)
                    setUploadedImages(prev => {
                        localStorage.setItem('cachedImages', JSON.stringify(imagePaths))
                        return imagePaths
                    })
                }
            } catch (error) {
                console.error('Error:', error)
            }
        }

        fetchUserUploads()

        return () => {
            isMounted = false
        }
    }, [user])

    useEffect(() => {
        if (uploadedImages.length > 0) {
            if (!selectedImage) {
                const firstImage = uploadedImages[0];
                setSelectedImage(firstImage);
                localStorage.setItem('cachedSelectedImage', firstImage);
            }
        } else {
            setSelectedImage(null);
            localStorage.removeItem('cachedSelectedImage');
        }
    }, [uploadedImages, selectedImage]);

    const handleImageUpload = (imagePath: string) => {
        setUploadedImages(prev => {
            const newImages = [...prev, imagePath]
            localStorage.setItem('cachedImages', JSON.stringify(newImages))
            return newImages
        })

        if (!selectedImage) {
            setSelectedImage(imagePath)
            localStorage.setItem('cachedSelectedImage', imagePath)
        }
    }

    const handleImageRemove = (imagePath: string) => {
        if (selectedImage === imagePath) {
            const newSelectedImage = uploadedImages.filter(img => img !== imagePath)[0] || null
            setSelectedImage(newSelectedImage)
            if (newSelectedImage) {
                localStorage.setItem('cachedSelectedImage', newSelectedImage)
            } else {
                localStorage.removeItem('cachedSelectedImage')
            }
        }

        setUploadedImages(prev => {
            const newImages = prev.filter(img => img !== imagePath)
            localStorage.setItem('cachedImages', JSON.stringify(newImages))
            return newImages
        })
    }

    const handleReset = () => {
        setIsRotating(true);
        setZoom(1);
    };

    const handleZoomIn = () => {
        setZoom(prevZoom => prevZoom + 0.1);
    };

    const handleZoomOut = () => {
        setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.1));
    };

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleClose = () => {
        setIsExpanded(false);
    };

    const handleImageClick = (imagePath: string, modelUrl: string) => {
        setSelectedImage(imagePath)
        setModelUrl(modelUrl)
        localStorage.setItem('cachedSelectedImage', imagePath)
    }

    const handleProgressUpdate = useCallback((imagePath: string, progress: number) => {
        setProcessingImages(prev => {
            const newState = { ...prev, [imagePath]: progress }

            if (progress === 100) {
                setTimeout(() => {
                    setProcessingImages(current => {
                        const { [imagePath]: removed, ...rest } = current
                        return rest
                    })
                }, 1000)
            }

            return newState
        })
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-background">
            <Navbar />
            <main className="flex-grow p-4 md:p-8 pt-24 md:pt-24">
                <div className="max-w-7xl mx-auto text-gray-900 dark:text-white">
                    <ImageUpload
                        onImageUpload={handleImageUpload}
                        onModelUrlChange={setModelUrl}
                        onProgressUpdate={handleProgressUpdate}
                    />

                    {selectedImage && (
                        <div className="grid grid-cols-1 md:grid-cols-10 gap-4 md:gap-8 mt-2">
                            {/* Left Panel - 2D Preview */}
                            <div className="rounded-lg p-4 md:p-6 shadow-sm md:col-span-3 border dark:border-gray-300 border-gray-200 bg-transparent overflow-hidden">
                                <ImagePreview
                                    imagePaths={uploadedImages}
                                    selectedImage={selectedImage}
                                    onImageClick={handleImageClick}
                                    onImageRemove={handleImageRemove}
                                    currentPage={page}
                                    onPageChange={setPage}
                                    isLoading={false}
                                    isExpanded={isExpanded}
                                    processingImages={processingImages}
                                />
                            </div>

                            {/* Right Panel - 3D Viewer */}
                            <div className="rounded-lg p-4 md:p-6 shadow-sm md:col-span-7 border dark:border-gray-300 border-gray-200 bg-transparent">
                                <div className="relative h-[300px] md:h-96 flex gap-4">
                                    <div className="flex-grow">
                                        <ProductViewer
                                            key={modelUrl}
                                            imagePath={selectedImage}
                                            modelUrl={modelUrl}
                                            isRotating={isRotating}
                                            zoom={zoom}
                                            isExpanded={isExpanded}
                                            onClose={handleClose}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center space-y-2">
                                        <ProductControls
                                            isRotating={isRotating}
                                            onRotateToggle={() => setIsRotating(!isRotating)}
                                            onZoomIn={handleZoomIn}
                                            onZoomOut={handleZoomOut}
                                            onExpand={handleExpand}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
} 