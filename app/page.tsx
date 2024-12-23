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
        // Redirect to workspace with image parameter
        router.push(`/workspace?image=${encodeURIComponent(imagePath)}`)
    }

    const handleModelUrlChange = (modelUrl: string | null) => {
        if (modelUrl) {
            // Update URL with model parameter if available
            router.push(`/workspace?model=${encodeURIComponent(modelUrl)}`)
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
        <div className="h-svh flex flex-col bg-gray-50 dark:bg-background">
            <div className="fixed inset-0 pointer-events-none z-0 hidden md:block">
                <P0Element />
            </div>

            <Navbar />
            <main className="flex-grow p-0 md:p-8 pt-28 md:pt-36 overflow-auto relative z-10">
                <div className="max-w-7xl mx-auto text-gray-900 dark:text-white pb-2">
                    <h1 className="text-2xl md:text-4xl font-bold text-center text-foreground translate-y-[30px] md:translate-y-[50px] mb-6 md:mb-8 px-4">
                        {mounted ? t(currentLanguage, 'ui.create_help') : ''}
                    </h1>

                    <div className="px-2 md:px-4">
                        <ImageUpload
                            onImageUpload={handleImageUpload}
                            onModelUrlChange={handleModelUrlChange}
                            onProgressUpdate={handleProgressUpdate}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
} 