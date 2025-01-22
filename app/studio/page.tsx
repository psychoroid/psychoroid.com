'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AssetLibrary } from '@/components/3D/AssetLibrary'
import { ModelGenerator } from '@/components/3D/ModelGenerator'
import { useUser } from '@/lib/contexts/UserContext'
import { Footer } from '@/components/design/Footer'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/supabase'

// Remove heavy components from initial bundle
const DynamicProductViewer = dynamic(() => import('@/components/3D/ProductViewer').then(mod => ({ default: mod.ProductViewer })), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-card/50 animate-pulse" />
})

export default function StudioPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useUser()

    const [isRotating, setIsRotating] = useState(true)
    const [zoom, setZoom] = useState(1)
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [modelUrl, setModelUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Protect route - do this first before any data fetching
    useEffect(() => {
        if (!user) {
            router.push('/auth/sign-in')
        }
    }, [user, router])

    // Simple fetch first asset function
    const fetchFirstAsset = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase.rpc('search_user_products', {
                p_user_id: user.id,
                p_search_query: '',
                p_page_size: 1,
                p_page: 1
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const firstAsset = data[0];
                if (!firstAsset.model_path?.includes('default-assets/')) {
                    setSelectedImage(firstAsset.image_path);
                    setModelUrl(firstAsset.model_path);
                }
            }
        } catch (error) {
            console.error('Error fetching first asset:', error);
        }
    }, [user?.id]);

    // Handle URL params
    useEffect(() => {
        const image = searchParams.get('image')
        const model = searchParams.get('model')
        if (image) setSelectedImage(image)
        if (model) setModelUrl(model)
    }, [searchParams])

    // Fetch first asset only once when component mounts
    useEffect(() => {
        if (user?.id && !searchParams.get('image') && !searchParams.get('model')) {
            fetchFirstAsset();
        }
    }, [user?.id, searchParams, fetchFirstAsset]);

    const handleImageClick = (imagePath: string | null, modelUrl: string | null) => {
        // Skip if it's a default asset
        if (modelUrl?.includes('default-assets/')) {
            return;
        }
        setSelectedImage(imagePath);
        setModelUrl(modelUrl);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        setIsUploading(true);
        try {
            console.log('File selected:', event.target.files);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handlePromptSubmit = async (prompt: string) => {
        if (!user) return;
        console.log('Prompt submitted:', prompt);
    };

    const handleGenerateVariation = async () => {
        if (!user) return;
        console.log('Generating variation');
    };

    if (!user) return null;

    return (
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
                                <Suspense fallback={<div className="w-full h-full bg-card/50 animate-pulse" />}>
                                    <AssetLibrary
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onImageClick={handleImageClick}
                                    />
                                </Suspense>
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
                                <DynamicProductViewer
                                    key={modelUrl}
                                    imagePath={selectedImage}
                                    modelUrl={modelUrl}
                                    isRotating={isRotating}
                                    zoom={zoom}
                                    isExpanded={isExpanded}
                                    onClose={() => setIsExpanded(false)}
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
                                <Suspense fallback={<div className="w-full h-full bg-card/50 animate-pulse" />}>
                                    <ModelGenerator
                                        onFileSelect={handleFileSelect}
                                        isUploading={isUploading}
                                        onPromptSubmit={handlePromptSubmit}
                                        user={user}
                                        onGenerateVariation={handleGenerateVariation}
                                    />
                                </Suspense>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <Footer />
            </div>
        </motion.div>
    )
} 