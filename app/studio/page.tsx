'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductViewer } from '@/components/3D/ProductViewer'
import { AssetLibrary } from '@/components/3D/AssetLibrary'
import { ModelGenerator } from '@/components/3D/ModelGenerator'
import { useUser } from '@/lib/contexts/UserContext'
import { Footer } from '@/components/design/Footer'
import { motion } from 'framer-motion'

export default function WorkspacePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useUser()

    const [isRotating, setIsRotating] = useState(true)
    const [zoom, setZoom] = useState(1)
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [modelUrl, setModelUrl] = useState<string | null>(null)
    const [processingImages, setProcessingImages] = useState<{ [key: string]: number }>({})
    const [isUploading, setIsUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [assetGroups, setAssetGroups] = useState<{
        id: string;
        title: string;
        assets: string[];
    }[]>([])

    // Get initial image and model from URL params
    useEffect(() => {
        const image = searchParams.get('image')
        const model = searchParams.get('model')
        if (image) setSelectedImage(image)
        if (model) setModelUrl(model)
    }, [searchParams])

    // Protect route
    useEffect(() => {
        if (!user) {
            router.push('/auth/sign-in')
        }
    }, [user, router])

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 2))
    }

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.1))
    }

    const handleExpand = () => {
        setIsExpanded(true)
    }

    const handleClose = () => {
        setIsExpanded(false)
    }

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            return
        }

        setIsUploading(true)
        try {
            // Handle file upload logic here
            // This should be similar to the logic in ImageUpload component
            console.log('File selected:', event.target.files)
        } catch (error) {
            console.error('Error uploading file:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handlePromptSubmit = async (prompt: string) => {
        if (!user) {
            return
        }

        try {
            // Handle prompt submission logic here
            console.log('Prompt submitted:', prompt)
        } catch (error) {
            console.error('Error processing prompt:', error)
        }
    }

    const handleGenerateVariation = async () => {
        if (!user) {
            return
        }

        try {
            // Handle variation generation logic here
            console.log('Generating variation')
        } catch (error) {
            console.error('Error generating variation:', error)
        }
    }

    const handleImageClick = (imagePath: string | null, modelUrl: string | null) => {
        setSelectedImage(imagePath);
        setModelUrl(modelUrl);
    };

    if (!user) return null

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="h-svh bg-background flex flex-col overflow-hidden"
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 overflow-y-auto scrollbar-hide md:h-[calc(100vh-4rem)] pb-32 md:pb-16"
                >
                    <div className="container mx-auto p-4 mt-6 md:p-4 md:max-w-[1920px]">
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col md:flex-row gap-4"
                        >
                            {/* Left Panel - File Browser */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-full md:w-[320px] shrink-0 order-1 md:order-1"
                            >
                                <div className="h-[50vh] md:h-[79vh]">
                                    <AssetLibrary
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        assetGroups={assetGroups}
                                        onImageClick={handleImageClick}
                                    />
                                </div>
                            </motion.div>

                            {/* Center Panel - Product Viewer */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full md:flex-1 order-2 md:order-2 md:min-w-[800px] xl:min-w-[800px]"
                            >
                                <div className="h-[50vh] overflow-y-auto scrollbar-hide md:h-[79vh] border border-border bg-card/50">
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
                            </motion.div>

                            {/* Right Panel - Model Generator */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-full md:w-[320px] shrink-0 order-3"
                            >
                                <div className="h-auto overflow-y-auto scrollbar-hide md:h-[79vh]">
                                    <ModelGenerator
                                        onFileSelect={handleFileSelect}
                                        isUploading={isUploading}
                                        onPromptSubmit={handlePromptSubmit}
                                        user={user}
                                        onGenerateVariation={handleGenerateVariation}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <Footer />
            </div>
        </>
    )
} 