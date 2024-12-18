'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductViewer } from '@/components/3D/ProductViewer'
import { ProductControls } from '@/components/3D/ProductControls'
import { ImagePreview } from '@/components/3D/ImagePreview'
import { WorkspaceChat } from './components/WorkspaceChat'
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'
import { AuthModal } from '@/components/auth/AuthModal'

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
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

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
            setShowAuthModal(true)
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
            setShowAuthModal(true)
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
            setShowAuthModal(true)
            return
        }

        try {
            // Handle variation generation logic here
            console.log('Generating variation')
        } catch (error) {
            console.error('Error generating variation:', error)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel - Asset Preview & Chat */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Asset Preview */}
                        <div className="rounded-lg border border-border bg-card p-4">
                            <ImagePreview
                                imagePaths={selectedImage ? [selectedImage] : []}
                                selectedImage={selectedImage}
                                onImageClick={(image, model) => {
                                    setSelectedImage(image)
                                    setModelUrl(model)
                                }}
                                onImageRemove={() => {
                                    setSelectedImage(null)
                                    setModelUrl(null)
                                }}
                                currentPage={1}
                                onPageChange={() => { }}
                                isLoading={false}
                                processingImages={processingImages}
                            />
                        </div>

                        {/* Workspace Chat */}
                        <div className="rounded-lg border border-border bg-card p-4">
                            <WorkspaceChat
                                onFileSelect={handleFileSelect}
                                isUploading={isUploading}
                                onPromptSubmit={handlePromptSubmit}
                                user={user}
                                setShowAuthModal={setShowAuthModal}
                                onGenerateVariation={handleGenerateVariation}
                            />
                        </div>
                    </div>

                    {/* Right Panel - 3D Viewer */}
                    <div className="lg:col-span-8">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="relative h-[600px] flex gap-4">
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
                </div>
            </main>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    )
} 