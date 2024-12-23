import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface PromoBannerProps {
    message?: string
    backgroundColor?: string
    textColor?: string
}

export const PromoBanner = ({
    message = "🚀 Dear Product Hunters: We apologize for the early launch. Please revisit in 48h to try our one-click 3D asset creation! Thank you so much for your understanding as we made a mistake on the launch date.",
    backgroundColor = "bg-blue-600",
    textColor = "text-white"
}: PromoBannerProps) => {
    const [isVisible, setIsVisible] = useState(true)
    const [hasBeenClosed, setHasBeenClosed] = useState(false)

    useEffect(() => {
        const bannerState = localStorage.getItem('promoBannerClosed')
        if (bannerState) {
            setHasBeenClosed(true)
            setIsVisible(false)
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        localStorage.setItem('promoBannerClosed', 'true')
        setHasBeenClosed(true)
    }

    if (!isVisible || hasBeenClosed) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[100]">
            <div className={`w-full ${backgroundColor} ${textColor} h-8 text-center shadow-md`}>
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center">
                    <p className="text-xs font-medium tracking-wide">
                        {message}
                    </p>
                    <button
                        onClick={handleClose}
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-none hover:bg-blue-700 transition-colors"
                        aria-label="Close banner"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    )
} 