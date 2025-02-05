'use client'

import { ImageUpload } from '@/components/3D/ImageUpload'
import { Navbar } from '@/components/design/Navbar'
import { useState, useEffect } from 'react'
import { useUser } from '@/lib/contexts/UserContext'
import { Footer } from '@/components/design/Footer'
import P0Element from '@/components/design/p0-element'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
// import { PromoBanner } from '@/components/design/PromoBanner'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
    const [mounted, setMounted] = useState(false)
    const { user } = useUser()
    const router = useRouter()
    const [processingImages, setProcessingImages] = useState<{ [key: string]: number }>({})
    const { currentLanguage } = useTranslation()

    useEffect(() => {
        setMounted(true)
        const savedProcessingImages = localStorage.getItem('processingImages')
        if (savedProcessingImages) {
            setProcessingImages(JSON.parse(savedProcessingImages))
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('processingImages', JSON.stringify(processingImages))
    }, [processingImages])

    const handleImageUpload = (imagePath: string) => {
        // Add a small delay to allow for exit animation
        setTimeout(() => {
            router.push(`/studio?image=${encodeURIComponent(imagePath)}`)
        }, 100)
    }

    const handleModelUrlChange = (modelUrl: string | null) => {
        if (modelUrl) {
            // Update URL with model parameter if available
            router.push(`/studio?model=${encodeURIComponent(modelUrl)}`)
        }
    }

    const handleProgressUpdate = (imagePath: string, progress: number) => {
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
    }

    if (!mounted) {
        return null // Prevents hydration issues
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-svh flex flex-col bg-gray-50 dark:bg-background"
        >
            {/* <AnimatePresence>
                <PromoBanner />
            </AnimatePresence> */}
            <div className="h-8" />

            <div className="fixed inset-0 pointer-events-none z-0 hidden md:block">
                <P0Element />
            </div>

            <div className="sticky top-8 z-50 bg-gray-50 dark:bg-background">
                <Navbar />
            </div>

            <motion.main
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                }}
                className="flex-grow p-0 md:p-8 pt-20 md:pt-28 overflow-auto relative z-10"
            >
                <div className="max-w-7xl mx-auto text-gray-900 dark:text-white pb-2">
                    <motion.h1
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 30, opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="text-2xl md:text-4xl font-bold text-center text-foreground translate-y-[30px] md:translate-y-[50px] mb-6 md:mb-8 px-4"
                    >
                        {mounted ? t(currentLanguage, 'ui.create_help') : ''}
                    </motion.h1>

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="px-2 md:px-4"
                    >
                        <ImageUpload
                            onImageUpload={handleImageUpload}
                            onModelUrlChange={handleModelUrlChange}
                            onProgressUpdate={handleProgressUpdate}
                        />
                    </motion.div>
                </div>
            </motion.main>
            <Footer />
        </motion.div>
    )
} 