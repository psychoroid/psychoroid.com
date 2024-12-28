'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductViewer } from '@/components/3D/ProductViewer'
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

export default function WorkspacePage() {
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

    // Handle URL params
    useEffect(() => {
        const image = searchParams.get('image')
        const model = searchParams.get('model')
        if (image) setSelectedImage(image)
        if (model) setModelUrl(model)
    }, [searchParams])

    // Fetch and display first asset if no URL params
    const fetchFirstAsset = useCallback(async () => {
        if (!user?.id || searchParams.get('image') || searchParams.get('model')) return;

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

                // Skip default assets
                if (firstAsset.model_path?.includes('default-assets/')) {
                    return;
                }

                // Check if the files exist in storage
                try {
                    // Get the folder path (user UUID)
                    const folderPath = firstAsset.model_path?.split('/')[0];

                    if (folderPath) {
                        // List all files in the user's folder
                        const { data: files, error: listError } = await supabase
                            .storage
                            .from('product-models')
                            .list(folderPath);

                        if (listError) {
                            console.error('Error listing files:', listError);
                            return;
                        }

                        // Get the filenames we're looking for
                        const modelFilename = firstAsset.model_path?.split('/').pop();
                        const imageFilename = firstAsset.image_path?.split('/').pop();

                        // Check if files exist
                        const modelExists = files?.some(file => file.name === modelFilename);
                        const imageExists = files?.some(file => file.name === imageFilename);

                        console.log('Storage check:', {
                            modelExists,
                            imageExists,
                            modelFilename,
                            imageFilename,
                            filesInFolder: files?.map(f => f.name)
                        });

                        // Only proceed if at least one file exists
                        if (!modelExists && !imageExists) {
                            console.error('No files found in storage');
                            return;
                        }

                        // Get signed URLs instead of public URLs
                        let modelUrl = null;
                        let imagePath = null;

                        if (modelExists && firstAsset.model_path) {
                            const { data: signedModelUrl } = await supabase
                                .storage
                                .from('product-models')
                                .createSignedUrl(firstAsset.model_path, 3600); // 1 hour expiry

                            if (signedModelUrl?.signedUrl) {
                                modelUrl = signedModelUrl.signedUrl;
                                console.log('Model URL created:', modelUrl);
                            } else {
                                console.error('Failed to create signed URL for model');
                            }
                        }

                        if (imageExists && firstAsset.image_path) {
                            const { data: signedImageUrl } = await supabase
                                .storage
                                .from('product-models')
                                .createSignedUrl(firstAsset.image_path, 3600); // 1 hour expiry

                            if (signedImageUrl?.signedUrl) {
                                imagePath = signedImageUrl.signedUrl;
                                console.log('Image URL created:', imagePath);
                            } else {
                                console.error('Failed to create signed URL for image');
                            }
                        }

                        // Log URLs for debugging
                        console.log('Asset details:', {
                            modelUrl,
                            imagePath,
                            originalModelPath: firstAsset.model_path,
                            originalImagePath: firstAsset.image_path,
                            assetId: firstAsset.id,
                            modelExists,
                            imageExists
                        });

                        // Set state only if we have valid URLs
                        if (modelUrl || imagePath) {
                            setSelectedImage(imagePath);
                            setModelUrl(modelUrl);
                            console.log('State updated with URLs');
                        } else {
                            console.error('No valid URLs available to set state');
                        }
                    }
                } catch (storageError) {
                    console.error('Error checking storage:', storageError);
                }
            }
        } catch (error) {
            console.error('Error fetching first asset:', error);
        }
    }, [user?.id, searchParams]);

    useEffect(() => {
        if (user?.id) {
            fetchFirstAsset();
        }
    }, [user?.id, fetchFirstAsset]);

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